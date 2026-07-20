import { supabase } from "@/lib/supabase";

export interface ShopData {
  name?: string;
  description?: string;
  logo_url?: string;
  address?: any;
  bank_details?: any;
  status?: string;
}

export const authService = {
  // Check if a user currently has a shop setup
  async checkUserShop(userId: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error("Error checking user shop:", error);
      throw error;
    }
    
    return data;
  },

  // Save or update shop information
  async upsertShopData(shopData: ShopData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if shop exists
    const existingShop = await this.checkUserShop(user.id);

    if (existingShop) {
      // Update existing shop
      const { data, error } = await supabase
        .from("stores")
        .update(shopData)
        .eq("owner_id", user.id);

      if (error) throw error;
      return data;
    } else {
      // Create new shop
      const { data, error } = await supabase
        .from("stores")
        .insert([{ ...shopData, owner_id: user.id }]);

      if (error) throw error;
      return data;
    }
  }
};
