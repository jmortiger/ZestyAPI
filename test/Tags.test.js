const E621 = require("./_tests");

describe("Tags", () => {
    // find()
    test("Fetch many tags", async () => {
        const result = await E621.Tags.find();
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
    });
    test("Fetch tags (by name)", async () => {
        const result = await E621.Tags.find({ name: ["mammal", "solo"] });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(2);
        expect(result.data[0].name).toBe("mammal");
    });
    test("Fetch tags (by category)", async () => {
        const result = await E621.Tags.find({ category: E621.Tags.Category.Artist });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].category).toBe(E621.Tags.Category.Artist);
    });
    test("Fetch tags (ordered)", async () => {
        const result = await E621.Tags.find({ order: "count" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
        expect(result.data[0].name).toBe("anthro");
    });

    // get()
    test("Fetch specific tag", async () => {
        const result = await E621.Tags.get("mammal");
        expect(result.status.code).toBe(200);
        expect(result.data.name).toBe("mammal");
    });
    test("Fetch undefined tag", async () => {
        const result = await E621.Tags.get(undefined);
        expect(result.status.code).toBe(491);
        expect(result.data.length).toBe(0);
    });
});