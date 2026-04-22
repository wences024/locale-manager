export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  businessName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  vatNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  supplierId?: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  fileName?: string;
  fileType?: string;
  status: 'parsing' | 'parsed' | 'reviewed' | 'confirmed' | 'error';
  parsingConfidence?: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  originalText: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  accountingCategoryId?: string;
  inventoryCategoryId?: string;
  aiSuggestedAccountingCategoryId?: string;
  aiSuggestedInventoryCategoryId?: string;
  aiConfidence?: number;
  status: 'pending' | 'ai_classified' | 'user_confirmed' | 'user_corrected' | 'unresolved';
  productId?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  normalizedName: string;
  accountingCategoryId: string;
  inventoryCategoryId: string;
  unit: string;
  defaultSupplierId?: string;
  averageCost: number;
  lastCost: number;
  sku?: string;
  active: boolean;
  stockQuantity: number;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  invoiceLineId?: string;
  type: 'load' | 'unload' | 'adjustment';
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes?: string;
}

export interface ManualExpense {
  id: string;
  date: string;
  amount: number;
  description: string;
  supplierId?: string;
  supplierName?: string;
  accountingCategoryId: string;
  inventoryCategoryId?: string;
  paymentMethod?: string;
  notes?: string;
  fileName?: string;
  createdAt: string;
}

export interface SalesImport {
  id: string;
  fileName: string;
  importDate: string;
  periodStart: string;
  periodEnd: string;
  status: 'preview' | 'imported' | 'cancelled';
  totalRevenue: number;
  linesCount: number;
  notes?: string;
}

export interface SalesLine {
  id: string;
  importId: string;
  date: string;
  product: string;
  department: string;
  quantity: number;
  revenue: number;
  accountingCategoryId?: string;
  paymentMethod?: string;
  mappingStatus: 'auto' | 'manual' | 'unresolved';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  extraHourlyRate: number;
  employmentType: 'dipendente' | 'collaboratore' | 'freelance';
  startDate: string;
  active: boolean;
  notes?: string;
}

export interface StaffHours {
  id: string;
  staffMemberId: string;
  date: string;
  ordinaryHours: number;
  extraHours: number;
  totalCost: number;
  notes?: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  type: 'revenue' | 'cost';
  color: string;
  icon?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
}

export interface ClassificationRule {
  id: string;
  name: string;
  conditionType: 'contains' | 'starts_with' | 'ends_with' | 'equals';
  conditionField: 'product_name' | 'supplier_name';
  conditionValue: string;
  accountingCategoryId: string;
  inventoryCategoryId?: string;
  priority: number;
  active: boolean;
  createdAt: string;
  matchCount: number;
}

export interface UnresolvedProduct {
  id: string;
  originalText: string;
  invoiceId: string;
  invoiceLineId: string;
  supplierName: string;
  suggestedAccountingCategoryId?: string;
  suggestedInventoryCategoryId?: string;
  aiConfidence?: number;
  status: 'pending' | 'resolved' | 'merged';
  resolvedAt?: string;
}

export interface SalesMappingRule {
  id: string;
  originalDepartment: string;
  accountingCategoryId: string;
  createdAt: string;
}

export interface AppData {
  users: User[];
  suppliers: Supplier[];
  invoices: Invoice[];
  invoiceLines: InvoiceLine[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  manualExpenses: ManualExpense[];
  salesImports: SalesImport[];
  salesLines: SalesLine[];
  staffMembers: StaffMember[];
  staffHours: StaffHours[];
  accountingCategories: AccountingCategory[];
  inventoryCategories: InventoryCategory[];
  classificationRules: ClassificationRule[];
  unresolvedProducts: UnresolvedProduct[];
  salesMappingRules: SalesMappingRule[];
}
