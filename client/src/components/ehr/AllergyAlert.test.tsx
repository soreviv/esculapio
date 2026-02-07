// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AllergyAlert } from "./AllergyAlert";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock resize observer which is needed for some radix primitives
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Helper to wrap component with required providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <TooltipProvider>
      {component}
    </TooltipProvider>
  );
};

describe("AllergyAlert", () => {
  it("renders with allergies", () => {
    const alergias = ["Penicilina", "Polen"];
    renderWithProviders(<AllergyAlert alergias={alergias} />);
    expect(screen.getByText(/Alergias conocidas/i)).toBeDefined();
    expect(screen.getByText(/Penicilina, Polen/i)).toBeDefined();
  });

  it("does not render when allergies list is empty", () => {
    const { container } = renderWithProviders(<AllergyAlert alergias={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    renderWithProviders(<AllergyAlert alergias={["Mani"]} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole("button", { name: /ignorar alerta/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has accessible label on dismiss button", () => {
    renderWithProviders(<AllergyAlert alergias={["Mani"]} />);
    const dismissButton = screen.getByRole("button", { name: /ignorar alerta/i });
    expect(dismissButton).toBeDefined();
  });
});
