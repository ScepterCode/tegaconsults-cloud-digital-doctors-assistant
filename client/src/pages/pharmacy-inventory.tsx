import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Plus, AlertTriangle, TrendingDown, DollarSign, 
  Search, Edit, Trash2, History, PackagePlus, PackageMinus 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  medicationName: string;
  genericName?: string;
  category: string;
  dosageForm: string;
  strength: string;
  quantityInStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  notes?: string;
  isLowStock: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  expiringSoon: number;
  byCategory: Record<string, number>;
}

export default function PharmacyInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // For demo, use actual hospital ID
  const hospitalId = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9";

  // Form states
  const [formData, setFormData] = useState({
    medicationName: "",
    genericName: "",
    category: "antibiotic",
    dosageForm: "tablet",
    strength: "",
    quantityInStock: 0,
    reorderLevel: 10,
    unitPrice: 0,
    supplier: "",
    batchNumber: "",
    expiryDate: "",
    location: "",
    notes: ""
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    transactionType: "restock",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInventory(), fetchStats()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams({ hospital_id: hospitalId });
      if (filterCategory !== "all") params.append("category", filterCategory);
      
      const response = await fetch(`http://localhost:5000/api/pharmacy-inventory?${params}`);
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/pharmacy-inventory/stats/summary?hospital_id=${hospitalId}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/api/pharmacy-inventory?hospital_id=${hospitalId}&user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Item added to inventory" });
        setAddDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/pharmacy-inventory/${selectedItem.id}/adjust-stock?user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockAdjustment)
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Stock adjusted successfully" });
        setStockDialogOpen(false);
        setStockAdjustment({ quantity: 0, transactionType: "restock", notes: "" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to adjust stock", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      medicationName: "",
      genericName: "",
      category: "antibiotic",
      dosageForm: "tablet",
      strength: "",
      quantityInStock: 0,
      reorderLevel: 10,
      unitPrice: 0,
      supplier: "",
      batchNumber: "",
      expiryDate: "",
      location: "",
      notes: ""
    });
  };

  const openStockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockDialogOpen(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = filteredInventory.filter(item => item.isLowStock);
  const expiredItems = filteredInventory.filter(item => item.isExpired);
  const expiringSoonItems = filteredInventory.filter(item => item.isExpiringSoon);

  const categories = [
    "antibiotic", "painkiller", "antiviral", "antifungal", "antihistamine",
    "antacid", "vitamin", "supplement", "injection", "other"
  ];

  const dosageForms = ["tablet", "capsule", "syrup", "injection", "cream", "drops", "inhaler"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage medication stock and supplies</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medication Name *</Label>
                  <Input
                    value={formData.medicationName}
                    onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Generic Name</Label>
                  <Input
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dosage Form *</Label>
                  <Select value={formData.dosageForm} onValueChange={(v) => setFormData({ ...formData, dosageForm: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dosageForms.map(form => (
                        <SelectItem key={form} value={form}>{form}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strength *</Label>
                  <Input
                    placeholder="e.g., 500mg, 10ml"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Initial Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Reorder Level *</Label>
                  <Input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Unit Price (₦) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Shelf/Cabinet"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Add to Inventory</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">₦{stats.totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiredItems}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({filteredInventory.length})</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock ({lowStockItems.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredItems.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon ({expiringSoonItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredInventory.map(item => (
            <InventoryCard key={item.id} item={item} onAdjustStock={openStockDialog} />
          ))}
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-3">
          {lowStockItems.map(item => (
            <InventoryCard key={item.id} item={item} onAdjustStock={openStockDialog} />
          ))}
        </TabsContent>

        <TabsContent value="expired" className="space-y-3">
          {expiredItems.map(item => (
            <InventoryCard key={item.id} item={item} onAdjustStock={openStockDialog} />
          ))}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-3">
          {expiringSoonItems.map(item => (
            <InventoryCard key={item.id} item={item} onAdjustStock={openStockDialog} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedItem?.medicationName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{selectedItem?.quantityInStock}</p>
            </div>

            <div>
              <Label>Transaction Type</Label>
              <Select 
                value={stockAdjustment.transactionType} 
                onValueChange={(v) => setStockAdjustment({ ...stockAdjustment, transactionType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (Add)</SelectItem>
                  <SelectItem value="dispense">Dispense (Remove)</SelectItem>
                  <SelectItem value="expired">Mark as Expired (Remove)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={stockAdjustment.quantity}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={stockAdjustment.notes}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                rows={2}
              />
            </div>

            <Button onClick={handleAdjustStock} className="w-full">
              Confirm Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InventoryCard({ item, onAdjustStock }: { item: InventoryItem; onAdjustStock: (item: InventoryItem) => void }) {
  return (
    <Card className={item.isExpired ? "border-red-500" : item.isLowStock ? "border-orange-500" : ""}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{item.medicationName}</h3>
              {item.genericName && (
                <span className="text-sm text-muted-foreground">({item.genericName})</span>
              )}
              <Badge variant="outline">{item.category}</Badge>
              {item.isExpired && <Badge variant="destructive">Expired</Badge>}
              {item.isExpiringSoon && !item.isExpired && <Badge variant="secondary" className="bg-yellow-100">Expiring Soon</Badge>}
              {item.isLowStock && <Badge variant="secondary" className="bg-orange-100">Low Stock</Badge>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Form & Strength</p>
                <p className="font-medium">{item.dosageForm} - {item.strength}</p>
              </div>
              <div>
                <p className="text-muted-foreground">In Stock</p>
                <p className="font-medium text-lg">{item.quantityInStock}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unit Price</p>
                <p className="font-medium">₦{item.unitPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Value</p>
                <p className="font-medium text-green-600">₦{item.totalValue.toLocaleString()}</p>
              </div>
              {item.location && (
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{item.location}</p>
                </div>
              )}
              {item.expiryDate && (
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">{new Date(item.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onAdjustStock(item)}>
              <PackagePlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
