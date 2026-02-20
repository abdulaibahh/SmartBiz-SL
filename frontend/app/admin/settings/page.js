"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { businessAPI } from "@/services/api";
import { useAuth } from "@/providers/AuthContext";
import toast from "react-hot-toast";
import { Building2, Save, Loader2, MapPin, Phone, FileText, Image, Upload, X } from "lucide-react";

function SettingsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shop_name: "",
    address: "",
    phone: "",
    logo_url: ""
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await businessAPI.get();
        if (res.data) {
          setForm({
            name: res.data.name || "",
            shop_name: res.data.shop_name || "",
            address: res.data.address || "",
            phone: res.data.phone || "",
            logo_url: res.data.logo_url || ""
          });
          setLogoPreview(res.data.logo_url || null);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, []);

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64String = await base64Promise;
      
      // Upload to backend
      const res = await businessAPI.uploadLogo(base64String);
      
      // Use the server URL
      const logoUrl = res.data?.logo_url;
      setLogoPreview(logoUrl);
      setForm(prev => ({ ...prev, logo_url: logoUrl }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logo_url: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("Saving business settings:", form);
      const res = await businessAPI.update(form);
      console.log("Save response:", res.data);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Building2 className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Business Settings</h1>
            <p className="text-sm text-zinc-500">Manage your business information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business Name (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={form.name}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-400 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-500 mt-1">Business name cannot be changed</p>
          </div>

          {/* Shop Name for PDF */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <FileText size={14} className="inline mr-1" />
              Shop Name (appears on PDF receipts)
            </label>
            <input
              type="text"
              placeholder="e.g., John's Supermarket"
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <MapPin size={14} className="inline mr-1" />
              Business Address
            </label>
            <input
              type="text"
              placeholder="e.g., 123 Main Street, Freetown"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <Phone size={14} className="inline mr-1" />
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g., +232 76 123456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <Image size={14} className="inline mr-1" />
              Business Logo
            </label>
            
            {/* Logo Preview Area */}
            {logoPreview ? (
              <div className="relative mt-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <button
                  type="button"
                  onClick={clearLogo}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-zinc-500 mb-2">Logo Preview:</p>
                <img 
                  src={logoPreview} 
                  alt="Business Logo" 
                  className="h-20 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-600 cursor-pointer transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-zinc-500 mb-2" />
                    <p className="text-sm text-zinc-400">Click to upload logo</p>
                    <p className="text-xs text-zinc-600 mt-1">PNG, JPG, GIF up to 2MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Upload Progress */}
            {uploadingLogo && (
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                Processing image...
              </div>
            )}

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>

          {/* Preview Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Receipt Preview</h3>
            <div className="bg-white rounded-lg p-4 text-black">
              <div className="text-center border-b pb-3 mb-3">
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="h-16 mx-auto mb-2 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <h4 className="font-bold text-lg text-gray-900">{form.shop_name || "Your Shop Name"}</h4>
                <p className="text-sm text-gray-600">{form.address || "Your Address"}</p>
                <p className="text-sm text-gray-600">{form.phone || "Your Phone"}</p>
              </div>
              <div className="text-sm text-gray-800">
                <p className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </p>
                <p className="border-t border-gray-300 my-2"></p>
                <p className="flex justify-between">
                  <span>Sample Item</span>
                  <span>NLE 0.00</span>
                </p>
                <p className="border-t border-gray-300 my-2"></p>
                <p className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>NLE 0.00</span>
                </p>
              </div>
            </div>
          </div>

    </div>
  );
}

export default function BusinessSettings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
