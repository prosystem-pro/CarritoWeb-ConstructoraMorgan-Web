import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Servicio } from '../../Modelos/Servicio';
import { ServicioServicios } from '../../Servicios/ServicioServicios';
import { PermisoServicio } from '../../Autorizacion/AutorizacionPermiso';
import { AlertaServicio } from '../../Servicios/Alerta-Servicio';
import { SafeUrlPipe } from '../../Servicios/SafePipe';
import { SpinnerGlobalComponent } from '../spinner-global/spinner-global.component';
import { Entorno } from '../../Entornos/Entorno';

@Component({
  selector: 'app-servicios',
  imports: [
    CommonModule,
    FormsModule,
    SafeUrlPipe,
    SpinnerGlobalComponent,
    RouterLink,
  ],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css',
})
export class ServiciosComponent implements OnInit {
  private readonly NombreEmpresa = `${Entorno.NombreEmpresa}`;
  // Configuración de ubicaciones requeridas
  readonly UBICACIONES_REQUERIDAS = [
    'CONSTRUCCION',
    'REMODELACIONES',
    'DISENIO_3D',
    'PLANIFICACION',
    'LICENCIAS_DE_CONTRUCCION',
    'AVALUOS',
    'ALQUILER_DE_MAQUINARIA',
    'ALQUILER_DE_CAMINONES',
  ];

  SERVICIOS_CONTENIDO: any = {
    CONSTRUCCION: {
      titulo: 'Tipo de construcción',
      items: [
        'Edificios corporativos',
        'Vivienda residencial',
        'Infraestructura básica',
        'Infraestructura industrial',
      ],
    },
    REMODELACIONES: {
      titulo: 'Servicios de remodelación',
      items: [
        'Remodelación de oficina',
        'Modernización de vivienda',
        'Diseño de interiores',
      ],
    },
    DISENIO_3D: {
      titulo: 'Tipo de diseño',
      items: [
        'Render para vivienda',
        'Render para edificios',
        'Proyectos arquitectónicos',
      ],
    },
    PLANIFICACION: {
      titulo: 'Tipo de planificación',
      items: [
        'Supervisión de proyectos',
        'Gestión y programación',
        'Organización y control',
      ],
    },
    LICENCIAS_DE_CONTRUCCION: {
      titulo: 'Tipo de licencias',
      items: [
        'Tramite de licencias municipales',
        'Gestión de permisos de obra',
        'Asesoría técnica legal',
        'Asesoría legal',
      ],
    },
    AVALUOS: {
      titulo: 'Tipo de avalúos',
      items: [
        'Avalúos comerciales',
        'Avalúos residenciales',
        'Inspección y análisis estructural',
        'Tasación de propiedades',
      ],
    },
    ALQUILER_DE_MAQUINARIA: {
      titulo: 'Tipo de maquinaria',
      items: [
        'Excavadora',
        'Retroexcavadora',
        'Concreteras',
      ],
    },
    ALQUILER_DE_CAMINONES: {
      titulo: 'Tipo de alquiler',
      items: [
        'Alquiler por hora',
        'Alquiler por día',
        'Retiro de escombro',
        'Transporte de material',
      ],
    },
  };

  servicioData: Servicio | null = null;
  videoUrl = '';
  imagenUrl = '';
  isLoading = false;
  modoAdmin = false;
  ubicacionActual: string = '';
  imagenSeleccionada: File | null = null;
  subiendoImagen = false;


  constructor(
    private route: ActivatedRoute,
    public Permiso: PermisoServicio,
    private servicioServicios: ServicioServicios,
    private alertaServicio: AlertaServicio,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modoAdmin = this.Permiso.TienePermiso('Servicio', 'Editar');
    this.route.params.subscribe((params) => {
      this.ubicacionActual = params['tipo'];
      this.inicializarServicios();
    });
  }

  inicializarServicios(): void {
    this.isLoading = true;
    this.servicioServicios.Listado().subscribe({
      next: (resp: any) => {
        const serviciosRemotos: Servicio[] = resp?.data || [];

        this.verificarYCrearFaltantes(serviciosRemotos);

        const actual = serviciosRemotos.find(
          (s) => s.Ubicacion === this.ubicacionActual
        );
        if (actual) {
          this.servicioData = actual;
          this.videoUrl = actual.UrlVideo || '';
          this.imagenUrl = actual.UrlImagen || '';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.isLoading = false),
    });
  }

  private verificarYCrearFaltantes(remotos: Servicio[]): void {
    this.UBICACIONES_REQUERIDAS.forEach((ubicacion) => {
      const existe = remotos.some((s) => s.Ubicacion === ubicacion);
      if (!existe) {
        const nuevo: Servicio = {
          Ubicacion: ubicacion,
          Estatus: 1,
          UrlVideo: '',
          UrlImagen: '',
        };
        this.servicioServicios.Crear(nuevo).subscribe();
      }
    });
  }

  guardarCambios(): void {
    if (!this.modoAdmin) return;

    const payload: Servicio = {
      ...this.servicioData,
      Ubicacion: this.ubicacionActual,
      UrlVideo: this.normalizarUrlYoutube(this.videoUrl),
      UrlImagen: this.imagenUrl,
      Estatus: 1,
    };

    const operacion = this.servicioData?.CodigoServicio
      ? this.servicioServicios.Editar(payload)
      : this.servicioServicios.Crear(payload);

    this.isLoading = true;
    operacion.subscribe({
      next: (resp: any) => {
        this.servicioData = resp?.data || payload;
        this.alertaServicio.MostrarExito(
          'Información actualizada correctamente'
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.alertaServicio.MostrarError('Error al guardar');
      },
    });
  }

  private normalizarUrlYoutube(url: string): string {
    if (!url || url.includes('/embed/')) return url;
    try {
      const id = url.includes('watch?v=')
        ? new URL(url).searchParams.get('v')
        : url.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    } catch {
      return url;
    }
  }

  onVideoUrlChange(valor: string): void {
    this.videoUrl = this.normalizarUrlYoutube(valor) || valor;
  }

  obtenerTitulo(ubicacion: string): string {
    const titulos: { [key: string]: string } = {
      CONSTRUCCION: 'CONSTRUCCIÓN',
      REMODELACIONES: 'REMODELACIONES',
      DISENIO_3D: 'DISEÑOS 3D',
      PLANIFICACION: 'PLANIFICACIÓN',
      LICENCIAS_DE_CONTRUCCION: 'LICENCIAS DE CONSTRUCCIÓN',
      AVALUOS: 'AVALUOS',
      ALQUILER_DE_MAQUINARIA: 'ALQUILER DE MAQUINARIA',
      ALQUILER_DE_CAMINONES: 'ALQUILER DE CAMIONES',
    };
    return titulos[ubicacion] || 'SERVICIO';
  }

  get contenidoServicio() {
    return this.SERVICIOS_CONTENIDO[this.ubicacionActual] || {
      titulo: '',
      items: []
    };
  }

  guardarVideo(): void {
    if (!this.modoAdmin || !this.servicioData?.CodigoServicio) return;

    const urlNormalizada = this.normalizarUrlYoutube(this.videoUrl);

    if (!urlNormalizada) {
      this.alertaServicio.MostrarAlerta('La URL de YouTube no es válida');
      return;
    }

    const payload: Partial<Servicio> = {
      CodigoServicio: this.servicioData.CodigoServicio,
      UrlVideo: urlNormalizada
    };

    this.isLoading = true;

    this.servicioServicios.Editar(payload as Servicio).subscribe({
      next: () => {
        this.servicioData!.UrlVideo = urlNormalizada;
        this.videoUrl = urlNormalizada;
        this.alertaServicio.MostrarExito('Video guardado correctamente');
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.alertaServicio.MostrarError('Error al guardar el video');
      },
    });
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.alertaServicio.MostrarAlerta(
        'Solo se permiten imágenes JPG, PNG o WEBP'
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) {
      this.alertaServicio.MostrarAlerta(
        'La imagen no debe superar los 5MB'
      );
      return;
    }

    this.imagenSeleccionada = archivo;
    this.subirImagenServicio();
  }

  subirImagenServicio(): void {
    if (!this.imagenSeleccionada || !this.servicioData?.CodigoServicio) return;

    const formData = new FormData();
    formData.append('Imagen', this.imagenSeleccionada);
    formData.append('CarpetaPrincipal', this.NombreEmpresa);
    formData.append('SubCarpeta', 'Servicio');
    formData.append(
      'CodigoPropio',
      this.servicioData.CodigoServicio.toString()
    );
    formData.append('CampoPropio', 'CodigoServicio');
    formData.append('CodigoVinculado', '');
    formData.append('CampoVinculado', '');
    formData.append('NombreCampoImagen', 'UrlImagen');

    this.subiendoImagen = true;

    this.servicioServicios.SubirImagen(formData).subscribe({
      next: (resp: any) => {
        this.alertaServicio.MostrarExito('Imagen actualizada correctamente');

        if (resp?.data?.UrlImagenPublica) {
          this.servicioData!.UrlImagen = resp.data.UrlImagenPublica;
        }

        this.imagenSeleccionada = null;
        this.subiendoImagen = false;
      },
      error: () => {
        this.subiendoImagen = false;
        this.alertaServicio.MostrarError('Error al subir la imagen');
      },
    });
  }

  eliminarImagenServicio(): void {
    if (!this.servicioData) return;

    this.alertaServicio
      .Confirmacion(
        '¿Está seguro que desea eliminar la imagen del servicio?',
        'Esta acción no se puede deshacer.'
      )
      .then((confirmado) => {
        if (!confirmado) return;

        const payload: Servicio = {
          ...this.servicioData,
          UrlImagen: '',
          Estatus: 1,
        };

        this.servicioServicios.Editar(payload).subscribe({
          next: () => {
            this.servicioData!.UrlImagen = '';
            this.alertaServicio.MostrarExito('Imagen eliminada correctamente');
          },
          error: () => {
            this.alertaServicio.MostrarError('Error al eliminar la imagen');
          },
        });
      });
  }
}
