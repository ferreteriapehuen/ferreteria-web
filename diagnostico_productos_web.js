// DIAGNÓSTICO DE PRODUCTOS EN LA PÁGINA PRINCIPAL
// Ejecuta esto en la consola de index.html (F12)

console.log("=== DIAGNÓSTICO DE PRODUCTOS ===\n");

// 1. Verificar que products esté cargado
console.log("1. PRODUCTOS CARGADOS:");
console.log("   Total productos:", typeof products !== 'undefined' ? products.length : "❌ NO CARGADO");

if (typeof products !== 'undefined' && products.length > 0) {
    // 2. Mostrar todos los productos
    console.log("\n2. LISTA DE PRODUCTOS:");
    products.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} (ID: ${p.id}, Cat: ${p.category})`);
    });

    // 3. Verificar productos por categoría
    console.log("\n3. PRODUCTOS POR CATEGORÍA:");
    const categories = {};
    products.forEach(p => {
        categories[p.category] = (categories[p.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count} productos`);
    });

    // 4. Verificar productos que se mostrarían
    const visibleProducts = products.filter(p => p.category !== 'aridos');
    console.log("\n4. PRODUCTOS VISIBLES EN INDEX:");
    console.log(`   Total visibles: ${visibleProducts.length}`);
    visibleProducts.forEach(p => {
        console.log(`   - ${p.name} (${p.category})`);
    });

    // 5. Verificar productos ocultos
    const hiddenProducts = products.filter(p => p.category === 'aridos');
    console.log("\n5. PRODUCTOS OCULTOS (categoría 'aridos'):");
    console.log(`   Total ocultos: ${hiddenProducts.length}`);
    hiddenProducts.forEach(p => {
        console.log(`   - ${p.name}`);
    });

    // 6. Verificar estructura de un producto
    console.log("\n6. ESTRUCTURA DE PRODUCTO (primer producto):");
    const sample = products[0];
    console.log("   Propiedades:", Object.keys(sample));
    console.log("   ✓ Tiene 'id':", sample.hasOwnProperty('id'));
    console.log("   ✓ Tiene 'name':", sample.hasOwnProperty('name'));
    console.log("   ✓ Tiene 'price':", sample.hasOwnProperty('price'));
    console.log("   ✓ Tiene 'category':", sample.hasOwnProperty('category'));
    console.log("   ✓ Tiene 'image':", sample.hasOwnProperty('image'));
    console.log("   ✓ Tiene 'stock':", sample.hasOwnProperty('stock'));
}

console.log("\n=== FIN DEL DIAGNÓSTICO ===");
console.log("Si no ves productos, revisa:");
console.log("1. ¿Los productos tienen categoría 'aridos'? (se ocultan por defecto)");
console.log("2. ¿Los productos tienen todas las propiedades necesarias?");
console.log("3. ¿Hay errores en la consola?");
