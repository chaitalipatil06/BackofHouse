import { beforeEach, describe, expect, it } from "vitest";
import { demoStore, resetDemo } from "@/lib/store/demo";

const qty = async (id: string) => (await demoStore.listInventory()).find((i) => i.id === id)!.quantity;

describe("demo store", () => {
  beforeEach(() => resetDemo());

  it("refuses a wrong PIN and clocks in with the right one", async () => {
    expect((await demoStore.clock("priya", "0000")).ok).toBe(false);
    const res = await demoStore.clock("priya", "3333");
    expect(res.ok).toBe(true);
    const priya = (await demoStore.listStaff()).find((s) => s.id === "priya")!;
    expect(priya.onShiftSince).not.toBeNull();
  });

  it("clocks out someone already on shift", async () => {
    const res = await demoStore.clock("maya", "1111");
    expect(res.message).toMatch(/clocked out/);
  });

  it("takes ingredients and a cup out of stock when a drink is made", async () => {
    const [milk, beans, cups] = [await qty("milk"), await qty("beans"), await qty("cup16")];
    await demoStore.recordMade("latte", 16);
    expect(await qty("milk")).toBeCloseTo(milk - 240 * 1.33);
    expect(await qty("beans")).toBeCloseTo(beans - 18 * 1.33);
    expect(await qty("cup16")).toBe(cups - 1);
  });

  it("doesn't use a cup for food", async () => {
    const cups = await qty("cup12");
    await demoStore.recordMade("f-croissant", 12);
    expect(await qty("cup12")).toBe(cups);
  });
});
