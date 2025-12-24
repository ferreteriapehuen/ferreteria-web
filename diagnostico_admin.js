// SCRIPT DE DIAGNÓSTICO COMPLETO
// Copia y pega esto en la consola del navegador (F12) en la página admin

console.log("=== DIAGNÓSTICO COMPLETO DEL PANEL ADMIN ===\n");

// 1. Verificar carga de datos
console.log("1. DATOS CARGADOS:");
console.log("   - Productos:", typeof products !== 'undefined' ? products.length : "❌ NO CARGADO");
console.log("   - Admins:", typeof admins !== 'undefined' ? admins.length : "❌ NO CARGADO");
console.log("   - Movimientos:", typeof movementsHistory !== 'undefined' ? movementsHistory.length : "❌ NO CARGADO");
console.log("   - Carrito POS:", typeof cart !== 'undefined' ? cart.length : "❌ NO INICIALIZADO");

// 2. Verificar productos tienen ID
if (typeof products !== 'undefined' && products.length > 0) {
    console.log("\n2. ESTRUCTURA DE PRODUCTOS:");
    const sampleProduct = products[0];
    console.log("   Producto de muestra:", sampleProduct);
    console.log("   ✓ Tiene campo 'id':", sampleProduct.hasOwnProperty('id'));
    console.log("   ✓ Tipo de ID:", typeof sampleProduct.id);
    console.log("   ✓ Tiene campo 'stock':", sampleProduct.hasOwnProperty('stock'));
    console.log("   ✓ Tiene campo 'price':", sampleProduct.hasOwnProperty('price'));
}

// 3. Verificar funciones del POS
console.log("\n3. FUNCIONES DEL POS:");
console.log("   - updatePosQty:", typeof window.updatePosQty);
console.log("   - removePosItem:", typeof window.removePosItem);
console.log("   - addToPosCart:", typeof addToPosCart);

// 4. Verificar funciones de inventario
console.log("\n4. FUNCIONES DE INVENTARIO:");
console.log("   - editStock:", typeof window.editStock);
console.log("   - renderInventory:", typeof renderInventory);

// 5. Probar una operación del carrito
if (typeof products !== 'undefined' && products.length > 0 && typeof cart !== 'undefined') {
    console.log("\n5. PRUEBA DE CARRITO:");
    const testProduct = products[0];
    console.log("   Agregando producto de prueba:", testProduct.name);
    
    // Simular agregar al carrito
    const testItem = { ...testProduct, qty: 2 };
    console.log("   Item de prueba:", testItem);
    console.log("   Subtotal calculado:", testItem.price * testItem.qty);
}

// 6. Verificar Firebase
console.log("\n6. CONEXIÓN FIREBASE:");
console.log("   - db:", typeof db !== 'undefined' ? "✓ Conectado" : "❌ NO conectado");

console.log("\n=== FIN DEL DIAGNÓSTICO ===");
console.log("Copia estos resultados y compártelos para análisis.");
