import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    try {
      await this.authService.signIn(this.email().trim(), this.password());
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorMessage.set(this.toErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private toErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'メールアドレスか パスワードが ちがうよ。';
    }
    if (code === 'auth/user-not-found') {
      return 'そのアカウントは みつかりませんでした。';
    }
    if (code === 'auth/too-many-requests') {
      return 'しっぱいが おおいので、しばらく してから ためしてね。';
    }
    return 'ログインに しっぱいしました。もういちど おためしください。';
  }
}
