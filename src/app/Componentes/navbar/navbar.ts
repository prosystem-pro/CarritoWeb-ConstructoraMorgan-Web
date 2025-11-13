import { Component } from '@angular/core';
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

  constructor(private router: Router, public Permiso: PermisoServicio,) { }
  cerrarSesion() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('colorClasificacion');
    localStorage.removeItem('colorClasificacionTexto');
    this.router.navigate(['/login']);
  }
}
