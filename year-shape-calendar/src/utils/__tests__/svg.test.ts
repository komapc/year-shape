/**
 * Tests for SVG utility functions
 */

import { describe, it, expect } from "vitest";
import {
  createSVGElement,
  createSectorPath,
  createSectorGroup,
  createLabel,
  applyDirectionMirroring,
  createGlowFilter,
} from "../svg";

describe("SVG Utilities", () => {
  describe("createSVGElement", () => {
    it("should create an SVG element with the correct namespace", () => {
      const circle = createSVGElement("circle");
      expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(circle.tagName).toBe("circle");
    });

    it("should set attributes when provided", () => {
      const rect = createSVGElement("rect", {
        x: "10",
        y: "20",
        width: "100",
        height: "50",
      });
      expect(rect.getAttribute("x")).toBe("10");
      expect(rect.getAttribute("y")).toBe("20");
      expect(rect.getAttribute("width")).toBe("100");
      expect(rect.getAttribute("height")).toBe("50");
    });

    it("should set styles when provided", () => {
      const circle = createSVGElement(
        "circle",
        {},
        {
          fill: "red",
          stroke: "blue",
        }
      );
      expect(circle.style.fill).toBe("red");
      expect(circle.style.stroke).toBe("blue");
    });
  });

  describe("createSectorPath", () => {
    it("should create a valid sector path", () => {
      const sector = createSectorPath({
        centerX: 0,
        centerY: 0,
        innerRadius: 100,
        outerRadius: 200,
        startAngle: 0,
        endAngle: Math.PI / 4,
        fillColor: "blue",
      });

      expect(sector.tagName).toBe("path");
      expect(sector.getAttribute("fill")).toBe("blue");
      expect(sector.getAttribute("d")).toBeTruthy();
    });

    it("should include stroke when provided", () => {
      const sector = createSectorPath({
        centerX: 0,
        centerY: 0,
        innerRadius: 100,
        outerRadius: 200,
        startAngle: 0,
        endAngle: Math.PI / 2,
        fillColor: "red",
        strokeColor: "white",
        strokeWidth: 2,
      });

      expect(sector.getAttribute("stroke")).toBe("white");
      expect(sector.getAttribute("stroke-width")).toBe("2");
    });

    it("should create correct path for full circle", () => {
      const sector = createSectorPath({
        centerX: 0,
        centerY: 0,
        innerRadius: 50,
        outerRadius: 100,
        startAngle: 0,
        endAngle: Math.PI * 2 - 0.01, // Nearly full circle
        fillColor: "green",
      });

      const pathData = sector.getAttribute("d");
      expect(pathData).toContain("M"); // Move to
      expect(pathData).toContain("A"); // Arc
      expect(pathData).toContain("L"); // Line to
      expect(pathData).toContain("Z"); // Close path
    });
  });

  describe("createSectorGroup", () => {
    it("should create a group with correct transform origin", () => {
      const group = createSectorGroup({
        centerX: 0,
        centerY: 0,
        angle: Math.PI / 4, // 45 degrees
        radius: 150,
        scale: 1.2,
      });

      expect(group.tagName).toBe("g");
      expect(group.style.transformOrigin).toBeTruthy();
      expect(group.style.transform).toContain("scale(1.2)");
    });

    it("should set data attributes", () => {
      const group = createSectorGroup({
        centerX: 0,
        centerY: 0,
        angle: 0,
        radius: 100,
        dataAttributes: {
          month: "0",
          index: "5",
        },
      });

      expect(group.getAttribute("data-month")).toBe("0");
      expect(group.getAttribute("data-index")).toBe("5");
    });

    it("should add CSS classes", () => {
      const group = createSectorGroup({
        centerX: 0,
        centerY: 0,
        angle: 0,
        radius: 100,
        classList: ["sector-group", "month-group"],
      });

      expect(group.classList.contains("sector-group")).toBe(true);
      expect(group.classList.contains("month-group")).toBe(true);
    });

    it("should set transition when provided", () => {
      const group = createSectorGroup({
        centerX: 0,
        centerY: 0,
        angle: 0,
        radius: 100,
        transition: "transform 0.3s ease",
      });

      expect(group.style.transition).toBe("transform 0.3s ease");
    });
  });

  describe("createLabel", () => {
    it("should create a text element with correct attributes", () => {
      const label = createLabel({
        x: 100,
        y: 200,
        text: "January",
        fontSize: 16,
        fontWeight: "bold",
        fill: "white",
      });

      expect(label.tagName).toBe("text");
      expect(label.getAttribute("x")).toBe("100");
      expect(label.getAttribute("y")).toBe("200");
      expect(label.textContent).toBe("January");
      expect(label.getAttribute("font-size")).toBe("16");
      expect(label.getAttribute("font-weight")).toBe("bold");
      expect(label.getAttribute("fill")).toBe("white");
    });

    it("should use default values when not provided", () => {
      const label = createLabel({
        x: 50,
        y: 50,
        text: "Test",
      });

      expect(label.getAttribute("font-size")).toBe("16");
      expect(label.getAttribute("font-weight")).toBe("normal");
      expect(label.getAttribute("fill")).toBe("currentColor");
    });

    it("should set text-anchor to middle", () => {
      const label = createLabel({
        x: 0,
        y: 0,
        text: "Center",
      });

      expect(label.getAttribute("text-anchor")).toBe("middle");
      expect(label.getAttribute("dominant-baseline")).toBe("middle");
    });

    it("should disable pointer events", () => {
      const label = createLabel({
        x: 0,
        y: 0,
        text: "Label",
      });

      expect(label.style.pointerEvents).toBe("none");
      expect(label.style.userSelect).toBe("none");
    });
  });

  describe("applyDirectionMirroring", () => {
    it("should return same angle for clockwise direction", () => {
      const angle = Math.PI / 4;
      const result = applyDirectionMirroring(angle, 1);
      expect(result).toBe(angle);
    });

    it("should negate angle for counter-clockwise direction", () => {
      const angle = Math.PI / 4;
      const result = applyDirectionMirroring(angle, -1);
      expect(result).toBe(-angle);
    });

    it("should handle zero angle", () => {
      expect(applyDirectionMirroring(0, 1)).toBe(0);
      expect(Math.abs(applyDirectionMirroring(0, -1))).toBe(0); // -0 is functionally equivalent to 0
    });

    it("should handle full circle", () => {
      const angle = Math.PI * 2;
      expect(applyDirectionMirroring(angle, 1)).toBe(angle);
      expect(applyDirectionMirroring(angle, -1)).toBe(-angle);
    });
  });

  describe("createGlowFilter", () => {
    it("should create a filter element with correct ID", () => {
      const filter = createGlowFilter("test-glow");
      expect(filter.tagName).toBe("filter");
      expect(filter.getAttribute("id")).toBe("test-glow");
    });

    it("should contain blur, flood, composite, and merge elements", () => {
      const filter = createGlowFilter("test-glow");
      
      const blur = filter.querySelector("feGaussianBlur");
      expect(blur).toBeTruthy();
      expect(blur?.getAttribute("stdDeviation")).toBe("4");

      const flood = filter.querySelector("feFlood");
      expect(flood).toBeTruthy();

      const composite = filter.querySelector("feComposite");
      expect(composite).toBeTruthy();

      const merge = filter.querySelector("feMerge");
      expect(merge).toBeTruthy();
      expect(merge?.children.length).toBe(2);
    });

    it("should use custom stdDeviation", () => {
      const filter = createGlowFilter("custom-glow", 8);
      const blur = filter.querySelector("feGaussianBlur");
      expect(blur?.getAttribute("stdDeviation")).toBe("8");
    });

    it("should use custom color", () => {
      const filter = createGlowFilter("colored-glow", 4, "rgba(255, 0, 0, 1)");
      const flood = filter.querySelector("feFlood");
      expect(flood?.getAttribute("flood-color")).toBe("rgba(255, 0, 0, 1)");
    });
  });
});

