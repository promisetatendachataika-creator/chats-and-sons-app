import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calculator, Save, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface CutPart {
  id: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  material: string;
}

export const CuttingList = () => {
  const [parts, setParts] = useState<CutPart[]>([]);
  const [wastePercentage, setWastePercentage] = useState(10); // Default 10% waste
  const [currentPart, setCurrentPart] = useState<Omit<CutPart, 'id'>>({
    name: '',
    length: 0,
    width: 0,
    quantity: 1,
    material: 'Melamine 16mm'
  });

  const materials = ['Melamine 16mm', 'Oak Veneer 18mm', 'MDF 16mm', 'Plywood 18mm'];

  const addPart = () => {
    if (currentPart.name && currentPart.length > 0 && currentPart.width > 0 && currentPart.quantity > 0) {
      setParts([...parts, { ...currentPart, id: Date.now().toString() }]);
      setCurrentPart({ ...currentPart, name: '', length: 0, width: 0, quantity: 1 });
    }
  };

  const removePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const calculateTotals = () => {
    let totalSqMeters = 0;
    parts.forEach(part => {
      // Length and width assumed to be in millimeters
      const areaInSqM = (part.length / 1000) * (part.width / 1000) * part.quantity;
      totalSqMeters += areaInSqM;
    });
    
    const totalWithWaste = totalSqMeters * (1 + (wastePercentage / 100));
    
    // Standard Melamine Sheet: 2750mm x 1830mm
    const sheetAreaM2 = 2.75 * 1.83; // 5.0325 sq meters
    const sheetsRequired = Math.ceil(totalWithWaste / sheetAreaM2);
    
    return {
      net: totalSqMeters.toFixed(2),
      gross: totalWithWaste.toFixed(2),
      sheets: sheetsRequired
    };
  };

  const totals = calculateTotals();

  const handleSave = () => {
    alert("This 'Save Configuration' button will eventually save your entire cut list to the Firebase database so you can pull it up later, generate a quote for the client, or send it directly to your supplier!");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-8 max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Cutting List Consolidator</h1>
            <p className="text-gray-400">Calculate total material and sheets required for your cabinetry</p>
          </div>
          <div className="glass-panel px-6 py-4 flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net Area</p>
              <p className="text-2xl font-bold">{totals.net} <span className="text-sm font-normal text-gray-500">m²</span></p>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Area w/ Waste</p>
              <p className="text-2xl font-bold">{totals.gross} <span className="text-sm font-normal text-gray-500">m²</span></p>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div>
              <p className="text-xs text-[var(--color-neon-blue)] uppercase tracking-wider mb-1">Sheets to Buy</p>
              <p className="text-3xl font-bold text-[var(--color-neon-blue)]">
                {totals.sheets} <span className="text-sm font-normal text-[var(--color-neon-blue)]/70 opacity-80">sheets</span>
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="glass-panel p-6 lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--color-neon-purple)]" />
              Add Cut Part
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Part Name / Ref</label>
                <input 
                  type="text" 
                  value={currentPart.name}
                  onChange={(e) => setCurrentPart({...currentPart, name: e.target.value})}
                  className="input-field mt-1" 
                  placeholder="e.g. Base Cabinet Left Side"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Length (mm)</label>
                  <input 
                    type="number" 
                    value={currentPart.length || ''}
                    onChange={(e) => setCurrentPart({...currentPart, length: Number(e.target.value)})}
                    className="input-field mt-1" 
                    placeholder="2400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Width (mm)</label>
                  <input 
                    type="number" 
                    value={currentPart.width || ''}
                    onChange={(e) => setCurrentPart({...currentPart, width: Number(e.target.value)})}
                    className="input-field mt-1" 
                    placeholder="600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                  <input 
                    type="number" 
                    value={currentPart.quantity}
                    onChange={(e) => setCurrentPart({...currentPart, quantity: Number(e.target.value)})}
                    className="input-field mt-1" 
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Waste Margin %</label>
                  <input 
                    type="number" 
                    value={wastePercentage}
                    onChange={(e) => setWastePercentage(Number(e.target.value))}
                    className="input-field mt-1 text-[var(--color-neon-blue)]" 
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Material</label>
                <select 
                  value={currentPart.material}
                  onChange={(e) => setCurrentPart({...currentPart, material: e.target.value})}
                  className="input-field mt-1 bg-[#141419]"
                >
                  {materials.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={addPart}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-5 h-5" /> Add to List
              </button>
            </div>
          </div>

          {/* List Display */}
          <div className="glass-panel p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[var(--color-neon-blue)]" />
                Consolidated List
              </h2>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors text-[var(--color-neon-blue)] border border-[var(--color-neon-blue)]/30"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>

            {parts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>No parts added yet. Add parts to calculate total material.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Part Name</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Material</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium text-right">Dimensions</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium text-right">Qty</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium text-right">Area (m²)</th>
                      <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, index) => {
                      const area = ((part.length / 1000) * (part.width / 1000) * part.quantity).toFixed(2);
                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={part.id} 
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-medium">{part.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-400">{part.material}</td>
                          <td className="py-3 px-4 text-sm text-right font-mono">{part.length} × {part.width}</td>
                          <td className="py-3 px-4 text-sm text-right font-mono">{part.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right text-[var(--color-neon-blue)] font-mono">{area}</td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => removePart(part.id)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
