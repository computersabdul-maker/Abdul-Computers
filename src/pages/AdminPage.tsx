import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  FolderTree,
  LogIn,
  LogOut,
  Package,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatPkr, getStatusLabel, t } from '../i18n/translations.ts';
import {
  Category,
  Order,
  OrderStatus,
  Product,
  ProductSpec,
  SpecialOffer,
  StoreSettings,
} from '../types/store.ts';
import { SafeImage } from '../components/SafeImage.tsx';

type AdminTab = 'products' | 'categories' | 'orders' | 'settings';

export function AdminPage() {
  const {
    lang,
    user,
    dbUser,
    authLoading,
    signInWithGoogle,
    signOutUser,
    getIdToken,
    categories,
    products,
    settings,
    refreshStore,
  } = useStore();
  const copy = t[lang];

  const [tab, setTab] = useState<AdminTab>('products');
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category modal state
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setSettingsForm(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  const loadOrders = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data.orders || []);
      }
    } catch {
      // ignore
    }
  }, [getIdToken]);

  useEffect(() => {
    if (dbUser?.role === 'admin') {
      loadOrders();
    }
  }, [dbUser, loadOrders]);

  const uploadFile = async (file: File): Promise<string> => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        dataBase64: dataUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const notify = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const notifyError = (msg: string) => {
    setStatusMessage(null);
    setErrorMessage(msg);
  };

  // Auth Gate
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-48 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
            {copy.adminAccessRequired}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">{copy.adminAccessDesc}</p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] py-3 text-sm font-semibold text-white hover:bg-[#0B1F3A] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{copy.signInGoogle}</span>
          </button>
        </div>
      </div>
    );
  }

  if (dbUser?.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#0B1F3A]">{copy.adminTitle}</h1>
          <p className="text-sm text-slate-600">
            {copy.adminUnauthorized.replace('{email}', user.email || '')}
          </p>
          <button
            type="button"
            onClick={signOutUser}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{copy.signOut}</span>
          </button>
        </div>
      </div>
    );
  }

  // Product Handlers
  const openNewProduct = () => {
    setEditingProduct({
      nameEn: '',
      nameUr: '',
      brand: 'HP',
      modelNumber: '',
      categoryId: categories[0]?.id || null,
      pricePkr: 0,
      oldPricePkr: null,
      stockQty: 10,
      isFeatured: false,
      isBestSeller: false,
      isLatest: true,
      isDemo: false,
      warrantyEn: '1 Year Official Warranty',
      warrantyUr: '1 سال آفیشل وارنٹی',
      descriptionEn: '',
      descriptionUr: '',
      specs: [{ keyEn: 'Processor', keyUr: 'پروسیسر', value: '' }],
      images: ['/src/assets/images/prod_business_laptop_1794665755663.jpg'],
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const token = await getIdToken();
      const isEdit = Boolean(editingProduct.id);
      const url = isEdit ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      setEditingProduct(null);
      await refreshStore();
      notify(isEdit ? 'Product updated successfully' : 'Product added successfully');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      await refreshStore();
      notify('Product deleted');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleProductImagesUpload = async (files: FileList | null) => {
    if (!files || !editingProduct) return;
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        urls.push(url);
      }
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), ...urls],
      });
      notify(`${urls.length} image(s) uploaded`);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Image upload failed');
    }
  };

  // Category Handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      const token = await getIdToken();
      const isEdit = Boolean(editingCategory.id);
      const url = isEdit ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCategory),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');
      setEditingCategory(null);
      await refreshStore();
      notify(isEdit ? 'Category updated' : 'Category created');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete category');
      await refreshStore();
      notify('Category deleted');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Order Status Handler
  const handleOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      await loadOrders();
      notify(`Order marked ${status}`);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  // Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      await refreshStore();
      notify('Website settings saved');
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            {copy.adminTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {user.email} · {lang === 'ur' ? 'ایڈمن کنٹرول پینل' : 'Store Administrator'}
          </p>
        </div>

        <button
          type="button"
          onClick={signOutUser}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>{copy.signOut}</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {statusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 w-fit">
        {[
          { id: 'products' as AdminTab, label: copy.tabProducts, icon: Package },
          { id: 'categories' as AdminTab, label: copy.tabCategories, icon: FolderTree },
          { id: 'orders' as AdminTab, label: `${copy.tabOrders} (${adminOrders.length})`, icon: ShoppingBag },
          { id: 'settings' as AdminTab, label: copy.tabSettings, icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCTS */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              {copy.tabProducts} ({products.length})
            </h2>
            <button
              type="button"
              onClick={openNewProduct}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B1F3A]"
            >
              <Plus className="w-4 h-4" />
              <span>{copy.addProduct}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">Product</th>
                  <th className="px-4 py-3 text-start">Brand / Model</th>
                  <th className="px-4 py-3 text-start">Price (PKR)</th>
                  <th className="px-4 py-3 text-start">Stock</th>
                  <th className="px-4 py-3 text-start">Placement</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={prod.images?.[0]}
                          alt={prod.nameEn}
                          className="w-12 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">{prod.nameEn}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{prod.nameUr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold text-[#1D4ED8]">{prod.brand}</span>
                      <span dir="ltr" className="block font-mono text-slate-500">
                        {prod.modelNumber}
                      </span>
                    </td>
                    <td dir="ltr" className="px-4 py-3 font-mono tabular-nums font-semibold text-[#0B1F3A]">
                      {formatPkr(prod.pricePkr)}
                    </td>
                    <td dir="ltr" className="px-4 py-3 font-mono tabular-nums">
                      {prod.stockQty}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {[
                        prod.isFeatured && 'Featured',
                        prod.isBestSeller && 'Best Seller',
                        prod.isLatest && 'Latest',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Standard'}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(JSON.parse(JSON.stringify(prod)))}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8]"
                          title={copy.editProduct}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                          title={copy.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              {copy.tabCategories} ({categories.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingCategory({
                  nameEn: '',
                  nameUr: '',
                  imageUrl: '/src/assets/images/prod_desktop_monitor_1794665755780.jpg',
                  iconKey: 'monitor',
                  displayOrder: categories.length + 1,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B1F3A]"
            >
              <Plus className="w-4 h-4" />
              <span>{copy.addCategory}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col"
              >
                <SafeImage
                  src={cat.imageUrl}
                  alt={cat.nameEn}
                  className="w-full h-32 object-cover bg-slate-100"
                />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#0B1F3A]">{cat.nameEn}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.nameUr}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ ...cat })}
                      className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                    >
                      {copy.editCategory}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      {copy.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">
            {copy.tabOrders} ({adminOrders.length})
          </h2>

          {adminOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No customer orders received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {adminOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span dir="ltr" className="font-mono font-bold text-base text-[#0B1F3A]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(ord.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-700">
                        {ord.customerName} · <span dir="ltr">{ord.customerPhone}</span> · {ord.city}
                      </p>
                      <p className="text-xs text-slate-500">{ord.deliveryAddress}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span dir="ltr" className="font-mono font-bold text-lg text-[#0B1F3A] tabular-nums">
                        {formatPkr(ord.totalPkr)}
                      </span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#0B1F3A]"
                      >
                        {(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                          (st) => (
                            <option key={st} value={st}>
                              {getStatusLabel(st, lang)}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.nameEn} ({item.modelNumber}) × {item.quantity}
                        </span>
                        <span dir="ltr" className="font-mono tabular-nums">
                          {formatPkr(item.pricePkr * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WEBSITE SETTINGS */}
      {tab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Store Identity & Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Name (English)
                </label>
                <input
                  value={settingsForm.storeNameEn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeNameEn: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Name (Urdu)
                </label>
                <input
                  dir="rtl"
                  value={settingsForm.storeNameUr}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeNameUr: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  dir="ltr"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number (digits with 92)
                </label>
                <input
                  dir="ltr"
                  value={settingsForm.whatsappNumber}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  dir="ltr"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Logo Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadFile(file);
                      setSettingsForm({ ...settingsForm, logoUrl: url });
                      notify('Logo uploaded');
                    }
                  }}
                  className="block w-full text-xs text-slate-600 file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-xs file:font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address (English)
                </label>
                <input
                  value={settingsForm.addressEn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, addressEn: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address (Urdu)
                </label>
                <input
                  dir="rtl"
                  value={settingsForm.addressUr}
                  onChange={(e) => setSettingsForm({ ...settingsForm, addressUr: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Fee (PKR)
                </label>
                <input
                  type="number"
                  value={settingsForm.deliveryFeePkr}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, deliveryFeePkr: Number(e.target.value) })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Free Delivery Threshold (PKR)
                </label>
                <input
                  type="number"
                  value={settingsForm.freeDeliveryThresholdPkr}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      freeDeliveryThresholdPkr: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Hero Banner & Special Offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Title (English)
                </label>
                <input
                  value={settingsForm.heroTitleEn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitleEn: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Title (Urdu)
                </label>
                <input
                  dir="rtl"
                  value={settingsForm.heroTitleUr}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitleUr: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Subtitle (English)
                </label>
                <input
                  value={settingsForm.heroSubtitleEn}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubtitleEn: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Subtitle (Urdu)
                </label>
                <input
                  dir="rtl"
                  value={settingsForm.heroSubtitleUr}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubtitleUr: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Banner Image Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadFile(file);
                      setSettingsForm({ ...settingsForm, heroImageUrl: url });
                      notify('Hero image uploaded');
                    }
                  }}
                  className="block w-full text-xs text-slate-600 file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-xs file:font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F3A]">Special Offer Banners</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsForm.offers.map((offer, idx) => (
                  <div key={offer.id} className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={offer.titleEn}
                        onChange={(e) => {
                          const next: SpecialOffer[] = [...settingsForm.offers];
                          next[idx] = { ...offer, titleEn: e.target.value };
                          setSettingsForm({ ...settingsForm, offers: next });
                        }}
                        placeholder="Offer Title EN"
                        className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        dir="rtl"
                        value={offer.titleUr}
                        onChange={(e) => {
                          const next: SpecialOffer[] = [...settingsForm.offers];
                          next[idx] = { ...offer, titleUr: e.target.value };
                          setSettingsForm({ ...settingsForm, offers: next });
                        }}
                        placeholder="Offer Title UR"
                        className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        value={offer.discountLabelEn}
                        onChange={(e) => {
                          const next: SpecialOffer[] = [...settingsForm.offers];
                          next[idx] = { ...offer, discountLabelEn: e.target.value };
                          setSettingsForm({ ...settingsForm, offers: next });
                        }}
                        placeholder="Discount Label EN"
                        className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                      />
                      <input
                        dir="rtl"
                        value={offer.discountLabelUr}
                        onChange={(e) => {
                          const next: SpecialOffer[] = [...settingsForm.offers];
                          next[idx] = { ...offer, discountLabelUr: e.target.value };
                          setSettingsForm({ ...settingsForm, offers: next });
                        }}
                        placeholder="Discount Label UR"
                        className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-lg bg-[#1D4ED8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
            >
              {copy.saveChanges}
            </button>
          </div>
        </form>
      )}

      {/* PRODUCT EDIT / CREATE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0B1F3A]">
                {editingProduct.id ? copy.editProduct : copy.addProduct}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name (English) *
                </label>
                <input
                  required
                  value={editingProduct.nameEn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name (Urdu) *
                </label>
                <input
                  required
                  dir="rtl"
                  value={editingProduct.nameUr || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameUr: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editingProduct.categoryId || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      categoryId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
                  <input
                    required
                    value={editingProduct.brand || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value })
                    }
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model # *</label>
                  <input
                    required
                    dir="ltr"
                    value={editingProduct.modelNumber || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, modelNumber: e.target.value })
                    }
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={editingProduct.pricePkr ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, pricePkr: Number(e.target.value) })
                    }
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Old Price (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.oldPricePkr ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        oldPricePkr: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Qty *
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={editingProduct.stockQty ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stockQty: Number(e.target.value) })
                    }
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionEn || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Urdu)
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={editingProduct.descriptionUr || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, descriptionUr: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isFeatured)}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                  }
                />
                <span>Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isBestSeller)}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })
                  }
                />
                <span>Best Seller</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isLatest)}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isLatest: e.target.checked })
                  }
                />
                <span>Latest Arrival</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isDemo)}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isDemo: e.target.checked })
                  }
                />
                <span>Demo Item</span>
              </label>
            </div>

            {/* Multiple Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Product Images ({editingProduct.images?.length || 0})
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {(editingProduct.images || []).map((imgUrl, idx) => (
                  <div key={idx} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <SafeImage src={imgUrl} alt={`Img ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          images: (editingProduct.images || []).filter((_, i) => i !== idx),
                        })
                      }
                      className="absolute top-0.5 end-0.5 bg-slate-900/80 text-white rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-[#1D4ED8] hover:border-[#1D4ED8]">
                  <Upload className="w-4 h-4" />
                  <span>{copy.uploadImage}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleProductImagesUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Specs Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Technical Specifications
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: [
                        ...(editingProduct.specs || []),
                        { keyEn: '', keyUr: '', value: '' },
                      ],
                    })
                  }
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                >
                  + Add Spec Row
                </button>
              </div>
              <div className="space-y-2">
                {(editingProduct.specs || []).map((sp: ProductSpec, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      value={sp.keyEn}
                      placeholder="Spec EN (e.g. RAM)"
                      onChange={(e) => {
                        const next = [...(editingProduct.specs || [])];
                        next[idx] = { ...sp, keyEn: e.target.value };
                        setEditingProduct({ ...editingProduct, specs: next });
                      }}
                      className="col-span-4 h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                    />
                    <input
                      dir="rtl"
                      value={sp.keyUr}
                      placeholder="تفصیل اردو"
                      onChange={(e) => {
                        const next = [...(editingProduct.specs || [])];
                        next[idx] = { ...sp, keyUr: e.target.value };
                        setEditingProduct({ ...editingProduct, specs: next });
                      }}
                      className="col-span-3 h-9 rounded-lg border border-slate-300 px-2.5 text-xs"
                    />
                    <input
                      dir="ltr"
                      value={sp.value}
                      placeholder="Value (e.g. 16GB DDR5)"
                      onChange={(e) => {
                        const next = [...(editingProduct.specs || [])];
                        next[idx] = { ...sp, value: e.target.value };
                        setEditingProduct({ ...editingProduct, specs: next });
                      }}
                      className="col-span-4 h-9 rounded-lg border border-slate-300 px-2.5 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          specs: (editingProduct.specs || []).filter((_, i) => i !== idx),
                        })
                      }
                      className="col-span-1 flex items-center justify-center text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="rounded-lg bg-[#1D4ED8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
              >
                {copy.saveChanges}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY EDIT / CREATE MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={handleSaveCategory}
            className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0B1F3A]">
                {editingCategory.id ? copy.editCategory : copy.addCategory}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name (English) *
              </label>
              <input
                required
                value={editingCategory.nameEn || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, nameEn: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name (Urdu) *
              </label>
              <input
                required
                dir="rtl"
                value={editingCategory.nameUr || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, nameUr: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Image Upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFile(file);
                    setEditingCategory({ ...editingCategory, imageUrl: url });
                  }
                }}
                className="block w-full text-xs text-slate-600 file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-xs file:font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                disabled={savingCategory}
                className="rounded-lg bg-[#1D4ED8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
              >
                {copy.saveChanges}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
