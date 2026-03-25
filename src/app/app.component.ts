import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './Componentes/header/header.component';
import { NgIf } from '@angular/common';
import { Entorno } from './Entornos/Entorno';
import { SidebarRedSocialComponent } from './Componentes/sidebar-red-social/sidebar-red-social.component';
import { CarritoEstadoService } from './Servicios/CarritoEstadoServicio';
import { PermisoServicio } from './Autorizacion/AutorizacionPermiso';
import { LoginServicio } from './Servicios/LoginServicio';
import { Navbar } from './Componentes/navbar/navbar';
import { Footer } from './Componentes/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, HeaderComponent, Footer, NgIf, SidebarRedSocialComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'CarritoWeb-Web';
  private temporizadorInactividad: any;
  private tiempoMaxInactividadMs = 15 * 60 * 1000;
  carritoAbierto = false;

  constructor(
    private router: Router,
    private carritoEstadoService: CarritoEstadoService,
    public Permiso: PermisoServicio,
    private loginServicio: LoginServicio
  ) {
    this.carritoEstadoService.carritoAbierto$.subscribe(
      estado => this.carritoAbierto = estado
    );
  }

  ngOnInit(): void {
    this.reiniciarTemporizadorInactividad();
    const tokenValido = this.loginServicio.ValidarToken();
    if (!tokenValido) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('colorClasificacion');
      localStorage.removeItem('colorClasificacionTexto');
    }
  }

  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  @HostListener('window:click')
  reiniciarInactividad(): void {
    this.reiniciarTemporizadorInactividad();
  }

  reiniciarTemporizadorInactividad(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      // Usuario público, no iniciar temporizador
      return;
    }

    clearTimeout(this.temporizadorInactividad);
    this.temporizadorInactividad = setTimeout(() => {
      console.warn('Usuario inactivo. Cerrando sesión automáticamente...');
      this.cerrarSesion();
    }, this.tiempoMaxInactividadMs);
  }

  cerrarSesion(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('colorClasificacion');
    localStorage.removeItem('colorClasificacionTexto');
    this.router.navigate(['/login']);
  }

  ObtenerNavegador(): string {
    const AgenteUsuario = navigator.userAgent;
    if (AgenteUsuario.includes('Chrome') && !AgenteUsuario.includes('Edg')) return 'Chrome';
    if (AgenteUsuario.includes('Firefox')) return 'Firefox';
    if (AgenteUsuario.includes('Safari') && !AgenteUsuario.includes('Chrome')) return 'Safari';
    if (AgenteUsuario.includes('Edg')) return 'Edge';
    return 'Desconocido';
  }

  // Rutas auxiliares
  esLogin(): boolean {
    return this.router.url === '/login';
  }
  esProductos(): boolean {
    return this.router.url.startsWith('/productos');
  }
  esContacto(): boolean {
    return this.router.url === '/contacto';
  }
  esOtro(): boolean {
    return this.router.url === '/otro';
  }
  esReporteProducto(): boolean {
    return this.router.url === '/reporte-producto';
  }
  esReporteVista(): boolean {
    return this.router.url === '/reporte-vista';
  }
  esReporteRedSocial(): boolean {
    return this.router.url === '/reporte-red-social';
  }
  esReporteTiempoPagina(): boolean {
    return this.router.url === '/reporte-tiempo-pagina';
  }

  mostrarSidebar(): boolean {
    return !(
      this.Permiso.TienePermiso('RedSocial', 'VerUnidad') &&
      this.router.url.startsWith('/reporte')
    );
  }
}