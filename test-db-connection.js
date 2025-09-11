/**
 * Database connection test to verify table existence and basic queries
 */

import { supabase } from './lib/supabase/client';

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');

  try {
    // Test 1: Check if we can connect to Supabase
    const { data: authData } = await supabase.auth.getSession();
    console.log('📍 Auth session:', authData.session?.user?.id || 'No session');

    // Test 2: Check table existence by querying schema
    console.log('\n📋 Testing table existence...');

    // Test product_listings table
    const { error: productListingsError } = await supabase
      .from('product_listings')
      .select('id')
      .limit(1);

    console.log('✅ product_listings table:', {
      exists: !productListingsError,
      error: productListingsError?.message,
      details: productListingsError?.details,
      hint: productListingsError?.hint,
      code: productListingsError?.code
    });

    // Test orders table
    const { error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    console.log('✅ orders table:', {
      exists: !ordersError,
      error: ordersError?.message,
      details: ordersError?.details,
      hint: ordersError?.hint,
      code: ordersError?.code
    });

    // Test messages table
    const { error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    console.log('✅ messages table:', {
      exists: !messagesError,
      error: messagesError?.message,
      details: messagesError?.details,
      hint: messagesError?.hint,
      code: messagesError?.code
    });

    // Test profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    console.log('✅ profiles table:', {
      exists: !profilesError,
      error: profilesError?.message,
      details: profilesError?.details,
      hint: profilesError?.hint,
      code: profilesError?.code
    });

    console.log('\n🔐 Testing with authenticated user filter...');

    if (authData.session?.user?.id) {
      // Test with authenticated user filter
      const { data: userProductListings, error: userProductError } = await supabase
        .from('product_listings')
        .select('*')
        .eq('farmer_id', authData.session.user.id)
        .limit(5);

      console.log('🧑‍🌾 User product listings:', {
        success: !userProductError,
        count: userProductListings?.length || 0,
        error: userProductError?.message,
        details: userProductError?.details,
        hint: userProductError?.hint,
        code: userProductError?.code
      });
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Export for use
export { testDatabaseConnection };

// Auto-run if this is the main module
if (require.main === module) {
  testDatabaseConnection();
}
