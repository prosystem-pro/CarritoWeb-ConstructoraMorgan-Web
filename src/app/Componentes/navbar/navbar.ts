import { Component, ViewChild, ElementRef  } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PermisoServicio } from '../../Autorizacion/AutorizacionPermiso';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

   @ViewChild('navbarCollapse') navbarCollapse!: ElementRef;

  constructor(private router: Router, public Permiso: PermisoServicio,) { }

  cerrarMenu(): void {
    const menu = this.navbarCollapse?.nativeElement;
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
    }
  }

  cerrarSesion() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('colorClasificacion');
    localStorage.removeItem('colorClasificacionTexto');
    this.router.navigate(['/login']);
    this.cerrarMenu();
  }
}
