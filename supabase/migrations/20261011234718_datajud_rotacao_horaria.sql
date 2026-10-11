-- Mantém o segredo do scheduler no Vault e altera somente a frequência.
-- A função consulta dois processos por hora, começando pelos mais antigos.
DO $$
DECLARE id_job bigint;
BEGIN
  SELECT jobid INTO id_job FROM cron.job WHERE jobname = 'datajud-diario';
  IF id_job IS NULL THEN
    RAISE EXCEPTION 'Agendamento DataJud existente não encontrado';
  END IF;
  PERFORM cron.alter_job(id_job, schedule := '0 * * * *', active := true);
END $$;
