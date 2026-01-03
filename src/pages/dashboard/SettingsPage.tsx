import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HeroButton } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/constants/currencies";
import { Palette, Sparkles, Circle, Check, Upload, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

interface Tax {
  name: string;
  rate: number;
}

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for new tax input
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");

  const [initialData, setInitialData] = useState({
    restaurantName: "",
    name: "",
    currency: "INR",
    googleMapsUrl: "",
    operationalHours: "",
    templateStyle: "classic",
    logo: "",
    address: "",
    fssai: "",
    gstNo: "",
    receiptFooter: "",
    taxes: [] as Tax[],
  });
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurantName: "",
    name: "",
    currency: "INR",
    googleMapsUrl: "",
    operationalHours: "",
    templateStyle: "classic",
    logo: "",
    address: "",
    fssai: "",
    gstNo: "",
    receiptFooter: "",
    taxes: [] as Tax[],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current restaurant settings
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/restaurant/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to fetch settings: ${response.status} - ${text}`
        );
      }

      const data = JSON.parse(text);
      if (data.success) {
        const logoUrl = data.restaurant.logo
          ? `${API_BASE_URL}${data.restaurant.logo}`
          : null;

        // Handle legacy taxName/taxRate if taxes array is empty/missing but legacy fields exist
        let taxes = data.restaurant.taxes || [];
        if (taxes.length === 0 && data.restaurant.taxName && data.restaurant.taxRate) {
          taxes = [{ name: data.restaurant.taxName, rate: Number(data.restaurant.taxRate) }];
        }

        const settings = {
          restaurantName: data.restaurant.restaurantName,
          name: data.restaurant.name,
          currency: data.restaurant.currency || "INR",
          googleMapsUrl: data.restaurant.googleMapsUrl || "",
          operationalHours: data.restaurant.operationalHours || "",
          templateStyle: data.restaurant.templateStyle || "classic",
          logo: data.restaurant.logo || "",
          address: data.restaurant.address || "",
          fssai: data.restaurant.fssai || "",
          gstNo: data.restaurant.gstNo || "",
          receiptFooter: data.restaurant.receiptFooter || "Thank You Visit Again",
          taxes: taxes,
        };

        setInitialData(settings);
        setRestaurantInfo(settings);

        if (logoUrl) {
          setLogoPreview(logoUrl);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching settings:", error);
      alert(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check if there are any changes
  useEffect(() => {
    const dataChanged = JSON.stringify(initialData) !== JSON.stringify(restaurantInfo);
    const logoChanged = logoFile !== null || removeLogo;
    setHasChanges(dataChanged || logoChanged);
  }, [restaurantInfo, initialData, logoFile, removeLogo]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRestaurantInfo({
      ...restaurantInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleCurrencyChange = (value: string) => {
    setRestaurantInfo({
      ...restaurantInfo,
      currency: value,
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setRestaurantInfo({
      ...restaurantInfo,
      templateStyle: templateId,
    });
  };

  // Tax Management
  const handleAddTax = () => {
    if (!newTaxName || !newTaxRate) return;

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0) {
      alert("Please enter a valid tax rate");
      return;
    }

    setRestaurantInfo({
      ...restaurantInfo,
      taxes: [...restaurantInfo.taxes, { name: newTaxName, rate }]
    });

    setNewTaxName("");
    setNewTaxRate("");
  };

  const handleRemoveTax = (index: number) => {
    const newTaxes = [...restaurantInfo.taxes];
    newTaxes.splice(index, 1);
    setRestaurantInfo({
      ...restaurantInfo,
      taxes: newTaxes
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo size should be less than 5MB');
        return;
      }

      setLogoFile(file);
      setRemoveLogo(false);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('restaurantName', restaurantInfo.restaurantName);
      formData.append('name', restaurantInfo.name);
      formData.append('currency', restaurantInfo.currency);
      formData.append('googleMapsUrl', restaurantInfo.googleMapsUrl);
      formData.append('operationalHours', restaurantInfo.operationalHours);
      formData.append('templateStyle', restaurantInfo.templateStyle);
      formData.append('address', restaurantInfo.address);
      formData.append('fssai', restaurantInfo.fssai);
      formData.append('gstNo', restaurantInfo.gstNo);
      formData.append('receiptFooter', restaurantInfo.receiptFooter);

      // Send taxes as JSON string
      formData.append('taxes', JSON.stringify(restaurantInfo.taxes));

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (removeLogo) {
        formData.append('removeLogo', 'true');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/restaurant/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update");

      setSaveSuccess(true);

      // Reset states
      setLogoFile(null);
      setRemoveLogo(false);

      // Reload settings after successful save
      setTimeout(async () => {
        await fetchSettings();
        setSaveSuccess(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const templates = [
    {
      id: "classic",
      name: "Classic",
      description: "Traditional card-based layout with full images",
      icon: <Palette className="h-6 w-6" />,
      preview: "Rich visuals, detailed cards, comprehensive filters",
    },
    {
      id: "modern",
      name: "Modern",
      description: "Contemporary design with gradients and smooth animations",
      icon: <Sparkles className="h-6 w-6" />,
      preview: "Sleek interface, gradient accents, floating elements",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Clean and simple with focus on content",
      icon: <Circle className="h-6 w-6" />,
      preview: "Stripped down, text-focused, maximum clarity",
    },
    {
      id: "TemplateBurgerBooch",
      name: "Booch",
      description: "Clean and simple with focus on content",
      icon: <Circle className="h-6 w-6" />,
      preview: "Stripped down, text-focused, maximum clarity",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header with Title and Save Button */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4 -mt-4 -mx-6 px-6 border-b">
        <h2 className="text-2xl font-bold text-foreground">
          Restaurant Settings
        </h2>
        <HeroButton
          onClick={handleSave}
          disabled={saving || saveSuccess || !hasChanges}
        >
          {saving ? (
            "Saving..."
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </HeroButton>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
          <p className="text-sm text-green-900 dark:text-green-100 font-medium">
            ✅ Settings saved successfully! Reloading...
          </p>
        </div>
      )}

      {/* Basic Information Card */}
      <Card className="card-glass border-0">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Restaurant Name</Label>
              <Input
                name="restaurantName"
                value={restaurantInfo.restaurantName}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter restaurant name"
              />
            </div>
            <div>
              <Label className="text-foreground">Owner Name</Label>
              <Input
                name="name"
                value={restaurantInfo.name}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter owner name"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div>
            <Label className="text-foreground mb-2 block">Restaurant Logo</Label>

            {!logoPreview ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative border-2 border-muted rounded-lg p-4 flex items-center gap-4">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Current Logo</p>
                  <p className="text-xs text-muted-foreground">
                    Your restaurant logo will appear in the customer menu and dashboard
                  </p>
                </div>
                <div className="flex gap-2">
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" type="button" asChild>
                      <span className="cursor-pointer">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Change
                      </span>
                    </Button>
                  </label>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-foreground">Currency</Label>
            <Select
              value={restaurantInfo.currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Google Maps URL</Label>
            <Input
              name="googleMapsUrl"
              value={restaurantInfo.googleMapsUrl}
              onChange={handleChange}
              className="mt-1"
              placeholder="https://maps.google.com/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your Google Maps share link here
            </p>
          </div>

          <div>
            <Label className="text-foreground">Operational Hours</Label>
            <Textarea
              name="operationalHours"
              value={restaurantInfo.operationalHours}
              onChange={handleChange}
              className="mt-1"
              placeholder="Mon-Fri: 9:00 AM - 10:00 PM&#10;Sat-Sun: 10:00 AM - 11:00 PM"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your restaurant's operating hours
            </p>
          </div>

          <div>
            <Label className="text-foreground">Full Address (Branch)</Label>
            <Textarea
              name="address"
              value={restaurantInfo.address}
              onChange={handleChange}
              className="mt-1"
              placeholder="Flat No, Building, Street, City, State, Zip"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">FSSAI Number</Label>
              <Input
                name="fssai"
                value={restaurantInfo.fssai}
                onChange={handleChange}
                className="mt-1"
                placeholder="1151600..."
              />
            </div>
            <div>
              <Label className="text-foreground">GST/Tax Number</Label>
              <Input
                name="gstNo"
                value={restaurantInfo.gstNo}
                onChange={handleChange}
                className="mt-1"
                placeholder="GSTIN..."
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Receipt Footer Message</Label>
            <Input
              name="receiptFooter"
              value={restaurantInfo.receiptFooter}
              onChange={handleChange}
              className="mt-1"
              placeholder="Thank You Visit Again"
            />
          </div>

          {/* Tax Configuration Section */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-foreground text-lg mb-2 block">Tax Configuration</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Add configured taxes to be automatically calculated on receipts (e.g., SGST, CGST, Service Charge).
            </p>

            {/* List of current taxes */}
            <div className="space-y-2 mb-4">
              {restaurantInfo.taxes.length === 0 ? (
                <p className="text-sm italic text-muted-foreground text-center py-2 border border-dashed rounded-md">
                  No taxes configured
                </p>
              ) : (
                restaurantInfo.taxes.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div>
                      <span className="font-semibold mr-2">{tax.name}</span>
                      <Badge variant="outline">{tax.rate}%</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTax(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Tax Form */}
            <div className="grid grid-cols-[1fr,100px,auto] gap-2 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Tax Name</Label>
                <Input
                  placeholder="e.g. VAT"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rate (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTax}
                disabled={!newTaxName || !newTaxRate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Selection Card */}
      <Card className="card-glass border-0">
        <CardHeader>
          <CardTitle>Customer Ordering Page Theme</CardTitle>
          <CardDescription>
            Choose how your menu appears to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${restaurantInfo.templateStyle === template.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50"
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg ${restaurantInfo.templateStyle === template.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                      }`}
                  >
                    {template.icon}
                  </div>
                  {restaurantInfo.templateStyle === template.id && (
                    <Badge className="bg-primary">Selected</Badge>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {template.preview}
                </p>
              </button>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
              💡 Preview Your Theme
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Scan any table QR code after saving to see how your selected theme
              looks to customers. All functionality remains the same - only the
              visual design changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;