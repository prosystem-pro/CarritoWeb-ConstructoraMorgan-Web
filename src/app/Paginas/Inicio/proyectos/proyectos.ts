import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarouselModalComponent } from '../../../Componentes/carousel-modal/carousel-modal.component';
import { CarouselProyectoComponent } from '../../../Componentes/carousel-proyecto/carousel-proyecto.component';
import { Carrusel } from '../../../Modelos/Carrusel';
import { CarruselImagen } from '../../../Modelos/CarruselImagen';
import { CarruselServicio } from '../../../Servicios/CarruselServicio';
import { CarruselImagenServicio } from '../../../Servicios/CarruselImagnServicio';
import { PermisoServicio } from '../../../Autorizacion/AutorizacionPermiso';
import { AlertaServicio } from '../../../Servicios/Alerta-Servicio';
import { SpinnerGlobalComponent } from '../../../Componentes/spinner-global/spinner-global.component';
import { EmpresaServicio } from '../../../Servicios/EmpresaServicio';
import { Empresa } from '../empresa/empresa';

declare var bootstrap: any;

@Component({
  selector: 'app-proyectos',
  imports: [CommonModule,
    FormsModule,
    CarouselProyectoComponent,
    CarouselModalComponent,
    SpinnerGlobalComponent],
  templateUrl: './proyectos.html',
  styleUrl: './proyectos.css'
})
export class Proyectos implements OnInit {
   @ViewChild(CarouselModalComponent) carouselModal!: CarouselModalComponent;

  proyectos: Carrusel[] = [];
  todasLasImagenes: CarruselImagen[] = [];
  
  isLoading = false;
  modoAdmin = false;

  // Paginación
  readonly PROYECTOS_POR_PAGINA = 8;
  paginaActual = 1;
  totalPaginas = 1;

  // Modal de edición
  proyectoEnEdicion: Carrusel | null = null;
  tituloEdicion = '';
  subtituloEdicion = '';
  descripcionEdicion = '';
  codigoEmpresa: number = 1;
  
  // Imágenes del proyecto seleccionado para el modal
  proyectoSeleccionado: Carrusel | null = null;
  imagenesProyectoSeleccionado: CarruselImagen[] = [];

  constructor(
    public Permiso: PermisoServicio,
    private carruselServicio: CarruselServicio,
    private carruselImagenServicio: CarruselImagenServicio,
    private alertaServicio: AlertaServicio,
    private empresaServicio: EmpresaServicio,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.verificarModoAdmin();
    this.obtenerCodigoEmpresa();
    this.cargarProyectos();
  }

  verificarModoAdmin(): void {
    this.modoAdmin = this.Permiso.TienePermiso('Carrusel', 'Editar') || 
                     this.Permiso.TienePermiso('Carrusel', 'Crear');
  }

  private async obtenerCodigoEmpresa(): Promise<void> {
  try {
    const empresa = await this.empresaServicio.ConseguirPrimeraEmpresa().toPromise();
    if (empresa && empresa.CodigoEmpresa) {
      this.codigoEmpresa = empresa.CodigoEmpresa;
    } else {
      console.warn('No se encontró información de empresa');
      this.alertaServicio.MostrarError('No se pudo obtener la información de la empresa');
    }
  } catch (error) {
    console.error('Error al obtener código de empresa:', error);
    this.alertaServicio.MostrarError('Error al cargar información de empresa');
  }
}


  cargarProyectos(): void {
    this.isLoading = true;
    
    this.carruselServicio.Listado().subscribe({
      next: (response: any) => {
        // Filtrar solo proyectos con Ubicacion que inicie con "proyecto-"
        this.proyectos = (response.data || [])
          .filter((p: Carrusel) => 
            p.Estatus === 1 && 
            p.Ubicacion && 
            p.Ubicacion.toLowerCase().startsWith('proyecto-')
          )
          .sort((a: Carrusel, b: Carrusel) => {
            // Ordenar por fecha de creación más reciente primero (si existe CodigoCarrusel)
            return (b.CodigoCarrusel || 0) - (a.CodigoCarrusel || 0);
          });
        
        this.calcularPaginacion();
        this.cargarTodasLasImagenes();
      },
      error: (error) => {
        this.isLoading = false;
        this.manejarError(error);
      }
    });
  }

  cargarTodasLasImagenes(): void {
    this.carruselImagenServicio.Listado().subscribe({
      next: (response: any) => {
        this.todasLasImagenes = response.data?.filter((img: CarruselImagen) => img.Estatus === 1) || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.manejarError(error);
      }
    });
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.proyectos.length / this.PROYECTOS_POR_PAGINA);
    
    // Si la página actual excede el total, volver a la primera
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = 1;
    }
  }

  get proyectosPaginados(): Carrusel[] {
    const inicio = (this.paginaActual - 1) * this.PROYECTOS_POR_PAGINA;
    const fin = inicio + this.PROYECTOS_POR_PAGINA;
    return this.proyectos.slice(inicio, fin);
  }

  get numeroPaginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  obtenerImagenesProyecto(codigoCarrusel: number | undefined): CarruselImagen[] {
    if (!codigoCarrusel) return [];
    return this.todasLasImagenes
      .filter(img => img.CodigoCarrusel === codigoCarrusel)
      .sort((a, b) => (Number(a.Orden) || 0) - (Number(b.Orden) || 0))
      .slice(0, 3); // Máximo 3 imágenes
  }

  /**
   * Genera el siguiente número de proyecto disponible
   */
  private obtenerSiguienteNumeroProyecto(): number {
    const numerosExistentes = this.proyectos
      .map(p => {
        const match = p.Ubicacion?.match(/proyecto-(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    return numerosExistentes.length > 0 
      ? Math.max(...numerosExistentes) + 1 
      : 1;
  }

  abrirModalNuevo(): void {
    const siguienteNumero = this.obtenerSiguienteNumeroProyecto();
    
    this.proyectoEnEdicion = {
      Estatus: 1,
      Ubicacion: `proyecto-${siguienteNumero}`
    };
    
    this.tituloEdicion = '';
    this.subtituloEdicion = '';
    this.descripcionEdicion = '';
    
    const modalElement = document.getElementById('modalEditarProyecto');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  editarProyecto(proyecto: Carrusel): void {
    this.proyectoEnEdicion = { ...proyecto };
    
    // Separar título y subtítulo usando el pipe
    if (proyecto.NombreCarrusel) {
      const partes = proyecto.NombreCarrusel.split('|');
      this.tituloEdicion = partes[0]?.trim() || '';
      this.subtituloEdicion = partes[1]?.trim() || '';
    }
    
    this.descripcionEdicion = proyecto.Descripcion || '';
    
    const modalElement = document.getElementById('modalEditarProyecto');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  guardarProyecto(): void {
    if (!this.tituloEdicion.trim()) {
      this.alertaServicio.MostrarAlerta('El título es obligatorio');
      return;
    }

    if (!this.proyectoEnEdicion) return;

    // Combinar título y subtítulo con pipe
    const nombreCompleto = this.subtituloEdicion.trim() 
      ? `${this.tituloEdicion.trim()}|${this.subtituloEdicion.trim()}`
      : this.tituloEdicion.trim();

    const proyectoGuardar: Carrusel = {
      ...this.proyectoEnEdicion,
      NombreCarrusel: nombreCompleto,
      Descripcion: this.descripcionEdicion.trim(),
      CodigoEmpresa: this.codigoEmpresa,
      Estatus: 1
    };

    // Validar que la ubicación sea de tipo proyecto
    if (!proyectoGuardar.Ubicacion || !proyectoGuardar.Ubicacion.toLowerCase().startsWith('proyecto-')) {
      proyectoGuardar.Ubicacion = `proyecto-${this.obtenerSiguienteNumeroProyecto()}`;
    }

    this.isLoading = true;

    const operacion = proyectoGuardar.CodigoCarrusel
      ? this.carruselServicio.Editar(proyectoGuardar)
      : this.carruselServicio.Crear(proyectoGuardar);

    operacion.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(
            proyectoGuardar.CodigoCarrusel 
              ? 'Proyecto actualizado correctamente' 
              : 'Proyecto creado correctamente'
          );
        }
        
        this.cerrarModalEdicion();
        this.cargarProyectos();
      },
      error: (error) => {
        this.isLoading = false;
        this.manejarError(error);
      }
    });
  }

  eliminarProyecto(codigoCarrusel: number): void {
    this.alertaServicio.Confirmacion(
      '¿Está seguro que desea eliminar este proyecto?',
      'Esta acción eliminará el proyecto y todas sus imágenes asociadas.'
    ).then((confirmado) => {
      if (confirmado) {
        this.isLoading = true;
        
        this.carruselServicio.Eliminar(codigoCarrusel).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            
            if (response?.tipo === 'Éxito') {
              this.alertaServicio.MostrarExito('Proyecto eliminado correctamente');
            }
            
            // Remover las imágenes del proyecto eliminado de la lista local
            this.todasLasImagenes = this.todasLasImagenes.filter(
              img => img.CodigoCarrusel !== codigoCarrusel
            );
            
            this.cargarProyectos();
          },
          error: (error) => {
            this.isLoading = false;
            this.manejarError(error);
          }
        });
      }
    });
  }

  administrarImagenes(proyecto: Carrusel): void {
    this.proyectoSeleccionado = proyecto;
    this.imagenesProyectoSeleccionado = this.obtenerImagenesProyecto(proyecto.CodigoCarrusel);
    
    setTimeout(() => {
      this.carouselModal.abrirModal();
    }, 100);
  }

  actualizarImagenesProyecto(imagenes: CarruselImagen[]): void {
    if (!this.proyectoSeleccionado?.CodigoCarrusel) return;

    // Actualizar la lista local de imágenes
    this.todasLasImagenes = [
      ...this.todasLasImagenes.filter(
        img => img.CodigoCarrusel !== this.proyectoSeleccionado?.CodigoCarrusel
      ),
      ...imagenes
    ];
    
    this.imagenesProyectoSeleccionado = imagenes;
    this.cdr.detectChanges();
  }

  cerrarModalEdicion(): void {
    const modalElement = document.getElementById('modalEditarProyecto');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
    
    this.proyectoEnEdicion = null;
    this.tituloEdicion = '';
    this.subtituloEdicion = '';
    this.descripcionEdicion = '';
  }

  private manejarError(error: any): void {
    const tipo = error?.error?.tipo;
    const mensaje = error?.error?.error?.message || error?.error?.message || 'Ocurrió un error inesperado.';

    if (tipo === 'Alerta') {
      this.alertaServicio.MostrarAlerta(mensaje);
    } else {
      this.alertaServicio.MostrarError({ error: { message: mensaje } });
    }
  }
}
