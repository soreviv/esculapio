// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PatientCard } from "./PatientCard";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock resize observer which is needed for some radix primitives
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("PatientCard UX", () => {
  it("has accessible buttons with tooltips", () => {
    render(
      <TooltipProvider>
        <PatientCard
          id="1"
          nombre="Juan"
          apellidoPaterno="Perez"
          curp="CURP123"
          fechaNacimiento="1990-01-01"
          sexo="M"
          status="activo"
          alergias={[]}
        />
      </TooltipProvider>
    );

    // Check for ARIA labels
    const scheduleBtn = screen.getByLabelText("Agendar cita");
    const deleteBtn = screen.getByLabelText("Eliminar paciente");

    expect(scheduleBtn).toBeDefined();
    expect(deleteBtn).toBeDefined();
  });
});
