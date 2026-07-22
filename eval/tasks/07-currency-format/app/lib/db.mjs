// Data layer. Stands in for the orders table. Totals are stored in cents.
const ORDERS = {
  "42": { order_id: "42", item: "Pour-Over Kettle", total_cents: 1999 },
  "43": { order_id: "43", item: "Burr Grinder", total_cents: 24950 },
};

export async function getOrder(id) {
  return ORDERS[id] ?? null;
}
