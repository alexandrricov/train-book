import { exportMyItemsToJSON, importMyItemsFromJSON } from "../firebase-db";

export function Settings() {
  return (
    <section>
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      <div className="flex items-center gap-2 mt-6">
        <button onClick={() => exportMyItemsToJSON()}>Export Items</button>
        <label>
          Import Items
          <input
            type="file"
            name="import"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importMyItemsFromJSON(file, {
                  mode: "append",
                  preserveIds: true,
                  reassignCreatedAt: false,
                });
              }
            }}
          />
        </label>
      </div>
    </section>
  );
}
