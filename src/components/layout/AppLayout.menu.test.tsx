import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Briefcase, FileText } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MenuGroup } from "./AppLayout";

const items = [
  { to: "/processos", label: "Processos", icon: Briefcase },
  { to: "/documentos", label: "Documentos e petições", icon: FileText },
];
function menu(collapsed: boolean, open = true) {
  return render(<MemoryRouter><TooltipProvider>
    <MenuGroup label="Produção Jurídica" icon={Briefcase} items={items}
      collapsed={collapsed} open={open} onToggle={vi.fn()} pathname="/documentos" />
  </TooltipProvider></MemoryRouter>);
}
describe("acesso aos documentos na navegação", () => {
  it("mantém o destino de documentos no grupo expandido", () => {
    menu(false);
    expect(screen.getByRole("link", { name: "Documentos e petições" })).toHaveAttribute("href", "/documentos");
  });
  it("oferece todos os destinos ao abrir o grupo recolhido", async () => {
    menu(true, false);
    fireEvent.keyDown(screen.getByRole("button", { name: "Produção Jurídica" }), { key: "Enter" });
    expect(await screen.findByRole("menuitem", { name: "Documentos e petições" })).toHaveAttribute("href", "/documentos");
    expect(screen.getByRole("menuitem", { name: "Processos" })).toHaveAttribute("href", "/processos");
  });
});
