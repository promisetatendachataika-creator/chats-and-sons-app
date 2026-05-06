import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Hammer, ShoppingBag, Trash2, UploadCloud, X, Sparkles } from 'lucide-react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface CatalogItem {
  id: string;
  name: string;
  category: 'Shop' | 'Service' | 'Furniture';
  description: string;
  price: number;
  unit: string;
  inStock: number | null;
  imageUrl?: string;
  createdAt: any;
}

const SEED_ITEMS = [
  { name: 'Melamine Board 16mm', category: 'Shop', description: 'High-quality white melamine-faced chipboard. Smooth finish, ideal for cabinets and shelving.', price: 580, unit: 'per sheet', inStock: 42, imageUrl: '' },
  { name: 'Plywood 18mm', category: 'Shop', description: 'Structural pine plywood. Strong and versatile for framing, floors and furniture carcasses.', price: 650, unit: 'per sheet', inStock: 30, imageUrl: '' },
  { name: 'MDF Board 16mm', category: 'Shop', description: 'Medium-density fibreboard. Ideal for painted finishes and routed decorative profiles.', price: 490, unit: 'per sheet', inStock: 25, imageUrl: '' },
  { name: 'Oak Veneer 18mm', category: 'Shop', description: 'Premium oak-veneered board. Natural grain, perfect for exposed furniture surfaces.', price: 890, unit: 'per sheet', inStock: 15, imageUrl: '' },
  { name: 'Soft-Close Hinges (Pair)', category: 'Shop', description: 'Blum 110° clip-top soft-close hinges. Fits standard cabinet doors, easy snap-on installation.', price: 85, unit: 'per pair', inStock: 200, imageUrl: '' },
  { name: 'Full-Extension Drawer Slides', category: 'Shop', description: '450mm heavy-duty drawer runners with soft close. 40kg load capacity.', price: 120, unit: 'per pair', inStock: 80, imageUrl: '' },
  { name: 'Wood Glue (500ml)', category: 'Shop', description: 'PVA-based woodworking adhesive. Fast setting, waterproof, sands easily.', price: 65, unit: 'per bottle', inStock: 60, imageUrl: '' },
  { name: 'Custom Kitchen Units', category: 'Service', description: 'Full kitchen design and installation. Includes base units, wall units, countertop and hardware. Measured and fitted by our team.', price: 4500, unit: 'custom project', inStock: null, imageUrl: '' },
  { name: 'Ceiling Installation', category: 'Service', description: 'Supply and installation of PVC or gypsum ceilings. Includes cornice and finishing. Price per square metre.', price: 169, unit: 'per square meter', inStock: null, imageUrl: '' },
  { name: 'Custom Wardrobe', category: 'Service', description: 'Built-in wardrobes designed to your space. Sliding or hinged doors, internal fittings included. Full installation.', price: 3200, unit: 'custom project', inStock: null, imageUrl: '' },
  { name: 'TV Wall Unit', category: 'Furniture', description: 'Modern floating TV wall unit with shelving and cabinets. Custom sizes and finishes available.', price: 2800, unit: 'per item', inStock: 3, imageUrl: '' },
  { name: 'Executive Office Desk', category: 'Furniture', description: 'L-shaped executive desk with cable management and lockable drawers. Melamine or veneer finish.', price: 3500, unit: 'per item', inStock: 2, imageUrl: '' },
  { name: 'Bookshelf Unit', category: 'Furniture', description: 'Adjustable 5-shelf bookcase. Available in oak, white or wenge finish. H:1800 W:900 D:300mm.', price: 1200, unit: 'per item', inStock: 5, imageUrl: '' },
];

export const AdminCatalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Shop',
    description: '',
    price: '',
    unit: 'per sheet',
    inStock: ''
  });

  const categories = ['Shop', 'Service', 'Furniture'];
  const units = ['per sheet', 'per square meter', 'per item', 'per hour', 'custom project', 'per pair', 'per bottle'];

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CatalogItem[];
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching catalog items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const seedCatalog = async () => {
    if (!window.confirm(`Add ${SEED_ITEMS.length} sample items to your catalog?`)) return;
    setSeeding(true);
    try {
      for (const item of SEED_ITEMS) {
        await addDoc(collection(db, 'products'), { ...item, createdAt: new Date() });
      }
    } catch (err) {
      alert('Error seeding catalog');
    } finally {
      setSeeding(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const MAX_PX = 1200;   // max width or height in pixels
      const QUALITY = 0.80;  // 80% JPEG quality

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width > height) {
            height = Math.round((height * MAX_PX) / width);
            width = MAX_PX;
          } else {
            width = Math.round((width * MAX_PX) / height);
            height = MAX_PX;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
            resolve(compressed);
          },
          'image/jpeg',
          QUALITY
        );
      };

      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview immediately from original
    setImagePreview(URL.createObjectURL(file));
    // Compress in background before upload
    const compressed = await compressImage(file);
    setImageFile(compressed);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Convert compressed file to Base64 data URL — stored directly in Firestore
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);

    let imageUrl = '';
    if (imageFile) {
      try {
        setUploadProgress(30);
        imageUrl = await getBase64(imageFile);
        setUploadProgress(100);
      } catch (imgError: any) {
        setUploadError('Could not read image: ' + imgError.message);
        setUploading(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: Number(formData.price),
        inStock: formData.category === 'Service' ? null : Number(formData.inStock),
        imageUrl,
        createdAt: new Date()
      });

      setFormData({ name: '', category: 'Shop', description: '', price: '', unit: 'per sheet', inStock: '' });
      clearImage();
      setUploadProgress(0);
      setUploadError(null);
    } catch (error: any) {
      console.error('Error saving item:', error);
      setUploadError('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shop': return <Package className="w-5 h-5 text-emerald-400" />;
      case 'Service': return <Hammer className="w-5 h-5 text-amber-400" />;
      case 'Furniture': return <ShoppingBag className="w-5 h-5 text-[var(--color-neon-purple)]" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Stock & Services</h1>
            <p className="text-gray-400">Add shop items, custom services, and furniture to your catalog.</p>
          </div>
          {items.length === 0 && (
            <button
              onClick={seedCatalog}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-neon-purple)]/30 bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple)]/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {seeding ? 'Adding items...' : 'Populate Sample Items'}
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Item Form */}
          <div className="bg-[#0b0b12] border border-white/10 rounded-2xl p-6 lg:col-span-1 h-fit" style={{boxShadow: '0 0 0 1px rgba(0,243,255,0.1), 0 8px 32px rgba(0,0,0,0.5)'}}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--color-neon-blue)]" />
              Add New Item
            </h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Name / Title</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field mt-1" 
                  placeholder="e.g. Oak Veneer Sheet or Custom Ceiling"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-field mt-1 bg-[#141419]"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Price (ZAR)</label>
                  <input 
                    type="number" 
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="input-field mt-1" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Unit</label>
                  <select 
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input-field mt-1 bg-[#141419]"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {formData.category !== 'Service' && (
                  <div>
                    <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Stock Qty</label>
                    <input 
                      type="number" 
                      name="inStock"
                      required
                      value={formData.inStock}
                      onChange={handleInputChange}
                      className="input-field mt-1" 
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-200 uppercase tracking-wider ml-1">Description</label>
                <textarea 
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field mt-1 resize-none" 
                  placeholder="Describe the material or service..."
                />
              </div>
              
              {/* Image Upload */}
              <div className="pt-2">
                <label className="text-xs text-gray-200 uppercase tracking-wider ml-1 block mb-2">Photo</label>
                
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 hover:border-[var(--color-neon-blue)]/50 text-gray-400 hover:text-white bg-white/2 hover:bg-white/5 py-6 rounded-xl transition-all duration-300"
                  >
                    <UploadCloud className="w-8 h-8" />
                    <span className="text-sm font-medium">Click to upload photo</span>
                    <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</span>
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {uploading && uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error message */}
              {uploadError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 leading-relaxed">
                  <p className="font-semibold mb-1">⚠ Save Failed</p>
                  <p>{uploadError}</p>
                  {uploadError.includes('timed out') && (
                    <p className="mt-2 text-red-200/70">
                      Fix: In Firebase Console → Storage → Rules, replace the rules with:<br/>
                      <code className="bg-black/40 px-1 rounded">allow read, write: if true;</code>
                    </p>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={uploading}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {imageFile ? `Uploading photo... ${uploadProgress > 0 ? uploadProgress + '%' : ''}` : 'Saving...'}
                  </>
                ) : 'Save Item to Catalog'}
              </button>
            </form>
          </div>

          {/* Catalog List */}
          <div className="glass-panel p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Current Catalog</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[var(--color-neon-blue)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Your catalog is empty.</p>
                <p className="text-sm text-gray-500 mt-1">Add materials and services using the form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex hover:bg-white/10 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="w-24 h-auto flex-shrink-0 bg-black/40">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
                          {getCategoryIcon(item.category)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.name}</h3>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[var(--color-neon-blue)]">R {item.price}</p>
                          <p className="text-xs text-gray-500">{item.unit}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{item.description}</p>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                        <div className="text-sm">
                          {item.category !== 'Service' ? (
                            <span className={Number(item.inStock) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {Number(item.inStock) > 0 ? `${item.inStock} in stock` : 'Out of stock'}
                            </span>
                          ) : (
                            <span className="text-amber-400">Service Offering</span>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

