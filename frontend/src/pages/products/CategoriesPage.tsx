import { Tag } from "lucide-react";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoCategories } from "../../data/demo/demoProducts";

export function CategoriesPage() {
  return (
    <div>
      <PageHeader title="التصنيفات" description="تصنيفات المنتجات كبيانات عرض فقط." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {demoCategories.map((category) => (
          <AppCard key={category.id}>
            <Tag className="mb-3" style={{ color: category.color }} />
            <p className="font-bold">{category.name}</p>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
