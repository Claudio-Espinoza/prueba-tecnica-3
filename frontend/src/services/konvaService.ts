import Konva from 'konva';

/**
 * Servicio para gestionar utilidades de Konva
 * Proporciona funciones para zoom, pan y otras interacciones con el canvas
 */
export class KonvaService {
   stage: Konva.Stage | null = null;
   layer: Konva.Layer | null = null;

   /**
    * Inicializar el stage y layer desde refs de Vue Konva
    */
   initStage(stageRef: any, layerRef: any) {
      if (stageRef?.getNode) {
         this.stage = stageRef.getNode();
      }
      if (layerRef?.getNode) {
         this.layer = layerRef.getNode();
      }
      console.log('🎨 Stage inicializado desde refs:', { hasStage: !!this.stage, hasLayer: !!this.layer });
   }

   /**
    * Configurar el zoom con scroll del mouse
    */
   setupZoom() {
      if (!this.stage || !this.layer) return;

      this.stage.on('wheel', (e) => {
         e.evt.preventDefault();
         
         const oldScale = this.layer!.scaleX();
         const pointer = this.stage!.getPointerPosition();
         
         if (!pointer) return;

         const mousePointTo = {
            x: (pointer.x - this.layer!.x()) / oldScale,
            y: (pointer.y - this.layer!.y()) / oldScale,
         };

         const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
         this.layer!.scale({ x: newScale, y: newScale });

         const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
         };
         
         this.layer!.position(newPos);
         this.stage!.batchDraw();
      });
   }

   /**
    * Configurar el pan con middle-click
    */
   setupPan() {
      if (!this.stage) return;

      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let startLayerX = 0;
      let startLayerY = 0;

      this.stage.on('mousedown', (e) => {
         if (e.evt.button === 1) { // middle-click
            isPanning = true;
            startX = e.evt.clientX;
            startY = e.evt.clientY;
            startLayerX = this.layer!.x();
            startLayerY = this.layer!.y();
            this.stage!.container.style.cursor = 'grab';
         }
      });

      this.stage.on('mousemove', (e) => {
         if (isPanning && this.layer) {
            const dx = e.evt.clientX - startX;
            const dy = e.evt.clientY - startY;
            this.layer.position({
               x: startLayerX + dx,
               y: startLayerY + dy,
            });
            this.stage!.batchDraw();
         }
      });

      this.stage.on('mouseup', () => {
         isPanning = false;
         this.stage!.container.style.cursor = 'default';
      });
   }

   /**
    * Resetear la vista del canvas
    */
   resetView() {
      if (!this.layer) return;
      this.layer.position({ x: 0, y: 0 });
      this.layer.scale({ x: 1, y: 1 });
      this.stage?.batchDraw();
   }

   /**
    * Obtener referencia al stage
    */
   getStage() {
      return this.stage;
   }

   /**
    * Obtener referencia al layer
    */
   getLayer() {
      return this.layer;
   }

   /**
    * Limpiar el servicio
    */
   destroy() {
      if (this.stage) {
         this.stage.destroy();
         this.stage = null;
         this.layer = null;
      }
   }
}

export const konvaService = new KonvaService();
