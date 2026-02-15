export default function PricingCard() {
  return (
    <div className="card p-6 max-w-sm">
      <h3 className="text-xl font-bold">SmartBiz Pro</h3>

      <p className="text-3xl font-bold mt-3">$10</p>
      <p className="text-sm text-zinc-400 mb-4">per month</p>

      <ul className="text-sm space-y-2 mb-4">
        <li>✔ AI Business Assistant</li>
        <li>✔ Debt Tracking</li>
        <li>✔ Inventory Automation</li>
        <li>✔ PDF Receipts</li>
        <li>✔ Multi-user</li>
      </ul>
    </div>
  );
}
