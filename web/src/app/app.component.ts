import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild(ToastContainerDirective, { static: true }) private recipiente!: ToastContainerDirective;
  private readonly toastr = inject(ToastrService);

  title = 'web';

  ngOnInit(): void {
    this.toastr.overlayContainer = this.recipiente;
  }
}
