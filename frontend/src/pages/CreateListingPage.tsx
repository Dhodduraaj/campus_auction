import React, { useState } from 'react';
import { listingService, CreateListingPayload } from '../services/listingService';
import { ItemCondition, ListingCategory } from '../types';
import { Upload, X, ArrowLeft, AlertCircle } from 'lucide-react';

interface CreateListingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CreateListingPage: React.FC<CreateListingPageProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('CYCLE');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('GOOD');
  const [startingPrice, setStartingPrice] = useState('500');
  const [minimumBidIncrement, setMinimumBidIncrement] = useState('50');

  // Default closing time to 48 hours from now
  const defaultClosingDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 48);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const [closingAtLocal, setClosingAtLocal] = useState(defaultClosingDate());

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const url = await listingService.uploadImage(file);
      setImageUrls((prev) => [...prev, url]);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Allowed formats: JPG, PNG, WEBP.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImageUrls((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (imageUrls.length === 0) {
      setError('Please upload at least one photograph of the item.');
      return;
    }

    const sPrice = parseFloat(startingPrice);
    const mIncrement = parseFloat(minimumBidIncrement);

    if (isNaN(sPrice) || sPrice <= 0) {
      setError('Starting price must be a positive number.');
      return;
    }

    if (isNaN(mIncrement) || mIncrement <= 0) {
      setError('Minimum bid increment must be a positive number.');
      return;
    }

    const closingDate = new Date(closingAtLocal);
    if (closingDate.getTime() <= Date.now() + 5 * 60 * 1000) {
      setError('Auction closing time must be at least 5 minutes in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateListingPayload = {
        title: title.trim(),
        category,
        description: description.trim(),
        condition,
        startingPrice: sPrice,
        minimumBidIncrement: mIncrement,
        closingAt: closingDate.toISOString(),
        imageUrls,
      };

      const created = await listingService.createListing(payload);
      onNavigate('listing-detail', { id: created.id });
    } catch (err: any) {
      setError(err.message || 'Failed to create auction listing. Please check the form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <button
        onClick={() => onNavigate('marketplace')}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h1 className="font-display font-black text-2xl text-slate-900 dark:text-white">
            Create Listing
          </h1>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Item Title *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              placeholder="Item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="CYCLE">Bicycles & Cycles</option>
                <option value="CALCULATOR">Calculators</option>
                <option value="BOOKS">Textbooks & Academic Notes</option>
                <option value="ELECTRONICS">Electronics & Gadgets</option>
                <option value="LAB_EQUIPMENT">Lab Equipment & Kits</option>
                <option value="FURNITURE">Hostel Furniture</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="NEW">New (Unopened / Mint)</option>
                <option value="LIKE_NEW">Like New (Lightly Used)</option>
                <option value="GOOD">Good (Functional with minor wear)</option>
                <option value="FAIR">Fair (Visible wear, works fine)</option>
                <option value="NEEDS_REPAIR">Needs Repair / Parts</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Item Description *
            </label>
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              placeholder="Item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Photographs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Photographs *
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase py-2.5 px-4 rounded border border-slate-300 dark:border-slate-700 transition-colors">
                <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <div className="flex-grow flex gap-2">
                <input
                  type="url"
                  placeholder="Image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-grow p-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold text-xs uppercase px-3 py-2 rounded"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Image Previews */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded border border-slate-300 dark:border-slate-700 overflow-hidden group"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-85 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Deadlines (INR) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Starting Price (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="Starting price (₹)"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full p-2.5 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Min. Bid Increment (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="Min. bid increment (₹)"
                value={minimumBidIncrement}
                onChange={(e) => setMinimumBidIncrement(e.target.value)}
                className="w-full p-2.5 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Closing Date/Time *
              </label>
              <input
                type="datetime-local"
                required
                value={closingAtLocal}
                onChange={(e) => setClosingAtLocal(e.target.value)}
                className="w-full p-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-display font-black text-sm uppercase tracking-wider py-3 rounded shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating Listing...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
