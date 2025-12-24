import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GaleriaComponente } from '../../../Componentes/galeria.componente/galeria.componente';
import { CarruselServicio } from '../../../Servicios/CarruselServicio';
import { AlertaServicio } from '../../../Servicios/Alerta-Servicio';
import { CarruselImagenServicio } from '../../../Servicios/CarruselImagnServicio';
import { PermisoServicio } from '../../../Autorizacion/AutorizacionPermiso';
import { Entorno } from '../../../Entornos/Entorno';
import { EmpresaServicio } from '../../../Servicios/EmpresaServicio';
import { Carrusel } from '../../../Modelos/Carrusel';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [GaleriaComponente, CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  carruselProveedores: Carrusel | null = null;
  carruselClientes: Carrusel | null = null;
  imagenesProveedores: any[] = [];
  imagenesClientes: any[] = [];
  proveedoresListos: boolean = false;
  clientesListos: boolean = false;
  codigoCarruselProveedores: number = 0;
  codigoCarruselClientes: number = 0;

  isLoading = true;
  error = false;
  codigoEmpresa: number | null = null;
  errorMessage: string = '';

  private NombreEmpresa = `${Entorno.NombreEmpresa}`;

  constructor(
    private router: Router,
    private carruselServicio: CarruselServicio,
    private carruselImagenServicio: CarruselImagenServicio,
    public Permiso: PermisoServicio,
    private alertaServicio: AlertaServicio,
    private EmpresaServicio: EmpresaServicio
  ) { }

  ngOnInit(): void {
    this.obtenerCodigoEmpresa().then(() => {
      this.cargarCarruselPorUbicacion('inicio-proveedores', 'proveedores');
      this.cargarCarruselPorUbicacion('inicio-clientes', 'clientes');
    });
  }

  private async obtenerCodigoEmpresa(): Promise<void> {
    try {
      const empresa = await this.EmpresaServicio.ConseguirPrimeraEmpresa().toPromise();
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

  private cargarCarruselPorUbicacion(ubicacion: string, tipo: 'proveedores' | 'clientes'): void {
    this.carruselServicio.Listado().subscribe({
      next: (Respuesta: any) => {
        const carruseles = Respuesta.data || [];
        const carruselEncontrado = carruseles.find((c: any) => c.Ubicacion === ubicacion);

        if (carruselEncontrado) {
          if (tipo === 'proveedores') {
            this.carruselProveedores = carruselEncontrado;
            this.codigoCarruselProveedores = carruselEncontrado.CodigoCarrusel;
          } else {
            this.carruselClientes = carruselEncontrado;
            this.codigoCarruselClientes = carruselEncontrado.CodigoCarrusel;
          }

          this.cargarImagenesCarrusel(carruselEncontrado.CodigoCarrusel, tipo);
        } else {
          this.crearCarruselPorDefecto(ubicacion, tipo);
        }
      },
      error: (err) => {
        this.alertaServicio.MostrarError(`Error al obtener datos de ${tipo}`);
        this.marcarComoListo(tipo);
      }
    });
  }

  private cargarImagenesCarrusel(codigoCarrusel: number, tipo: 'proveedores' | 'clientes'): void {
    this.carruselImagenServicio.ListadoCarrusel(codigoCarrusel).subscribe({
      next: (Respuesta) => {
        const imagenes = (Respuesta.data || [])
          .filter((img: any) => img.Estatus === 1)
          .sort((a: any, b: any) => (a.Orden || 999) - (b.Orden || 999));

        if (tipo === 'proveedores') {
          this.imagenesProveedores = imagenes;
          this.proveedoresListos = true;
        } else {
          this.imagenesClientes = imagenes;
          this.clientesListos = true;
        }

      },
      error: (err) => {
        console.error(`Error al cargar imágenes de ${tipo}:`, err);

        if (tipo === 'proveedores') {
          this.imagenesProveedores = [];
          this.proveedoresListos = true;
        } else {
          this.imagenesClientes = [];
          this.clientesListos = true;
        }
      }
    });
  }

  private crearCarruselPorDefecto(ubicacion: string, tipo: 'proveedores' | 'clientes'): void {
    if (!this.codigoEmpresa) {
      this.marcarComoListo(tipo);
      return;
    }

    const nombreCarrusel = tipo === 'proveedores'
      ? 'Galería de Proveedores'
      : 'Galería de Clientes';

    const descripcion = tipo === 'proveedores'
      ? 'Carrusel de imágenes de proveedores'
      : 'Carrusel de imágenes de clientes';

    const carruselDefecto = {
      CodigoEmpresa: this.codigoEmpresa,
      NombreCarrusel: nombreCarrusel,
      Descripcion: descripcion,
      Ubicacion: ubicacion,
      Estatus: 1
    };

    this.carruselServicio.Crear(carruselDefecto).subscribe({
      next: (response) => {
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(response.message);
        }

        const carruselCreado = response.Entidad || response;

        if (tipo === 'proveedores') {
          this.carruselProveedores = carruselCreado;
        } else {
          this.carruselClientes = carruselCreado;
        }

        this.cargarImagenesCarrusel(carruselCreado.CodigoCarrusel, tipo);
      },
      error: (error) => {
        const mensaje = error?.error?.message || 'Ocurrió un error inesperado.';
        this.alertaServicio.MostrarError({ error: { message: mensaje } });
        this.marcarComoListo(tipo);
      }
    });
  }

  private marcarComoListo(tipo: 'proveedores' | 'clientes'): void {
    if (tipo === 'proveedores') {
      this.proveedoresListos = true;
      this.imagenesProveedores = [];
    } else {
      this.clientesListos = true;
      this.imagenesClientes = [];
    }
  }

  refrescarGaleria(tipo: 'proveedores' | 'clientes'): void {
    const ubicacion = tipo === 'proveedores' ? 'Nosotros' : 'MenuCategoria';

    if (tipo === 'proveedores') {
      this.proveedoresListos = false;
    } else {
      this.clientesListos = false;
    }

    this.cargarCarruselPorUbicacion(ubicacion, tipo);
  }

  abrirServicio(servicio: string): void {
    console.log('Click en abrir servicios');
    // Mapeamos los nombres del HTML a las constantes del API
  const mapaServicios: { [key: string]: string } = {
    'construccion': 'CONSTRUCCION',
    'remodelacion': 'REMODELACIONES',
    'disenos3d': 'DISENIO_3D',
    'planificacion': 'PLANIFICACION',
    'licencias': 'LICENCIAS_DE_CONTRUCCION',
    'avaluos': 'AVALUOS',
    'maquinaria': 'ALQUILER_DE_MAQUINARIA',
    'camion': 'ALQUILER_DE_CAMINONES'
  };

  const servicioId = mapaServicios[servicio] || servicio;
  this.router.navigate(['/servicio', servicioId]);
  }
}