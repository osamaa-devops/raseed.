import { Plus } from "lucide-react";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable } from "../../components/tables/DataTable";
import { demoProducts } from "../../data/demo/demoProducts";

export function ProductsPage() {
  return (
    <div>
      <PageHeader title="المنتجات" description="قائمة المنتجات التجريبية، بدون CRUD حقيقي الآن." actions={<AppButton icon={Plus}>إضافة لاحقًا</AppButton>} />
      <DataTable
        columns={["المنتج", "الباركود", "السعر", "المخزون", "الحالة"]}
        rows={demoProducts}
        renderRow={(product) => (
          <tr key={product.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{product.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{product.barcode}</td>
            <td className="px-4 py-3">{product.price} ج</td>
            <td className="px-4 py-3">{product.stock}</td>
            <td className="px-4 py-3"><StatusBadge label={product.stock <= product.minStock ? "منخفض" : "متاح"} tone={product.stock <= product.minStock ? "warning" : "success"} /></td>
          </tr>
        )}
      />
    </div>
  );
}
