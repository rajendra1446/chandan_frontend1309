import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "PLANT_MANAGER", "LAB_CHEMIST", "STORE_MANAGER", "OPERATOR"]).default("OPERATOR"),
  department: z.string().optional()
});

export const castLengthItemSchema = z.object({
  length_meters: z.number().min(0.1, "Length must be at least 0.1m"),
  piece_count: z.number().int().min(1, "Piece count must be at least 1"),
  weight_per_piece_kg: z.number().optional(),
  total_weight_mt: z.number().optional(),
  bundle_code: z.string().optional(),
  remarks: z.string().optional()
});

export const castHeatSchema = z.object({
  heat_number: z.string().min(2, "Heat number is required (e.g.CH-01)").toUpperCase(),
  grade: z.string().min(2, "Grade is required (e.g.  304, 316L)"),
  section: z.string().min(2, "Section size is required (e.g. 120x120 mm)"),
  remarks: z.string().optional(),
  lengths: z.array(castLengthItemSchema).min(1, "At least one length specification is required")
});

export const labCheckSchema = z.object({
  heat_id: z.string().min(1, "Heat is required"),
  test_certificate_no: z.string().optional(),
  c_percent: z.number().min(0).max(100).default(0.06),
  mn_percent: z.number().min(0).max(100).default(1.8),
  si_percent: z.number().min(0).max(100).default(0.5),
  s_percent: z.number().min(0).max(100).default(0.012),
  p_percent: z.number().min(0).max(100).default(0.025),
  cr_percent: z.number().min(0).max(100).default(18.2),
  ni_percent: z.number().min(0).max(100).default(8.1),
  mo_percent: z.number().min(0).max(100).default(0.2),
  cu_percent: z.number().min(0).max(100).default(0.15),
  surface_quality: z.string().default("Clean, sound surface").optional(),
  internal_soundness: z.string().default("Sound macrostructure").optional(),
  verdict: z.enum(["PENDING", "APPROVED", "REJECTED", "ON_HOLD", "CONDITIONAL_PASS"]).default("APPROVED"),
  lab_remarks: z.string().optional()
});

export const dispatchBreakdownItemSchema = z.object({
  length_id: z.string().optional(),
  length_meters: z.number(),
  pieces: z.number().int().min(1),
  weight_mt: z.number().optional()
});

export const dispatchSchema = z.object({
  heat_number: z.string().min(2, "Heat number is required").toUpperCase(),
  target_plant: z.string().min(2, "Target plant is required (e.g. Rolling Mill #1)"),
  dispatched_pieces: z.number().int().min(1, "Pieces must be at least 1"),
  dispatched_weight_mt: z.number().min(0.001, "Weight must be greater than 0"),
  vehicle_number: z.string().optional(),
  lengths_breakdown: z.array(dispatchBreakdownItemSchema).optional(),
  remarks: z.string().optional()
});

export const finishedProductSchema = z.object({
  heat_number: z.string().min(2, "Heat number is required").toUpperCase(),
  dispatch_id: z.string().optional(),
  finished_product_name: z.string().min(2, "Product name is required (e.g. SS 304 Wire Rod in Coils)"),
  finished_size: z.string().min(1, "Size is required (e.g. 5.5 mm)"),
  standard_specification: z.string().optional().default("ASTM A276 / EN 10088-3"),
  input_billet_weight_mt: z.number().min(0.001, "Input billet weight is required"),
  finished_pieces: z.number().int().min(0).default(0),
  finished_weight_mt: z.number().min(0.001, "Finished product weight is required"),
  mill_name: z.string().default("Rolling Mill #1"),
  lot_number: z.string().optional(),
  remarks: z.string().optional()
});

export const rejectionSchema = z.object({
  heat_number: z.string().min(2, "Heat number is required").toUpperCase(),
  dispatch_id: z.string().optional(),
  stage: z.string().min(2, "Stage is required (e.g. ROLLING_MILL, BILLET_YARD)"),
  rejection_type: z.string().min(2, "Rejection type is required (e.g. END_CROP_SCRAP, SURFACE_CRACKS)"),
  rejected_pieces: z.number().int().default(0),
  rejected_weight_mt: z.number().min(0.001, "Rejected weight MT is required"),
  disposition: z.string().default("SCRAP_REMELT"),
  rejection_reason: z.string().min(3, "Reason is required"),
  remarks: z.string().optional()
});

export const plantReturnSchema = z.object({
  heat_number: z.string().min(2, "Heat number is required").toUpperCase(),
  returned_from: z.string().min(2, "Returned from is required (e.g. Rolling Mill #1)"),
  returned_to: z.string().min(2, "Returned to is required (e.g. Billet Yard Stock)"),
  return_type: z.string().default("UNUSED_BILLET_RETURN"),
  returned_pieces: z.number().int().min(1, "Returned pieces must be at least 1"),
  returned_weight_mt: z.number().min(0.001, "Returned weight MT is required"),
  return_reason: z.string().min(3, "Reason is required"),
  stock_restored: z.boolean().default(true),
  remarks: z.string().optional()
});
