# Plan de Implementación: Ferretería El Perro 100% Funcional

Para lograr una web profesional y completamente operativa, hemos dividido el trabajo en 4 fases principales.

## Fase 1: Interactividad Básica (Prioridad Inmediata)
Objetivo: Que nada se sienta "roto" al hacer clic.
- [ ] **Menú Móvil**: Hacer que el icono de hamburguesa (`fa-bars`) despliegue el menú en celulares.
- [ ] **Buscador Inteligente**: Que la barra de búsqueda filtre los productos en tiempo real.
- [ ] **Navegación por Categorías**: Que los enlaces del menú principal ("Herramientas", "Pinturas") filtren automáticamente la grilla de productos.
- [ ] **Botones "Muertos"**: Redirigir enlaces como "Tiendas" o "Ayuda" a secciones reales o un aviso de "Próximamente".

## Fase 2: Experiencia de Compra (El Carrito)
Objetivo: Que el usuario pueda revisar su pedido antes de comprar.
- [ ] **Vista de Carrito**: Crear una ventana lateral (Drawer) que se abra al tocar el icono del carro.
- [ ] **Gestión de Items**: Permitir eliminar productos o cambiar cantidades en el carrito.
- [ ] **Cálculo de Total**: Mostrar el subtotal y total en tiempo real.

## Fase 3: Checkout vía WhatsApp (Venta Real)
Objetivo: Cerrar la venta sin necesidad de complejos sistemas de pago bancario (ideal para empezar).
- [ ] **Generador de Pedido**: Botón "Finalizar Compra" en el carrito.
- [ ] **Integración WhatsApp**: Formatear el pedido en texto (Ej: "Hola, quiero: 1x Taladro, 2x Pintura. Total: $120.000") y abrir la app de WhatsApp automáticamente para enviarlo a la tienda.

## Fase 4: Páginas Secundarias y Detalles
Objetivo: Profundidad de contenido.
- [ ] **Detalle de Producto**: Modal o página propia para cada producto con descripción larga y especificaciones.
- [ ] **Página de Contacto/Nosotros**: Secciones dedicadas con mapa y formulario real.
