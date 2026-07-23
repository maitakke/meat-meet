import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AVATAR_PRESETS } from '../../../core/avatar-presets';
import { AuthService } from '../../../core/services/auth.service';
import { FamilyService } from '../../../core/services/family.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  protected readonly avatarPresets = AVATAR_PRESETS;

  protected readonly familyName = signal('');
  protected readonly yourName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly secretWord = signal('');
  protected readonly selectedAvatar = signal(AVATAR_PRESETS[0]);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected onSelectAvatar(avatar: string): void {
    this.selectedAvatar.set(avatar);
  }

  protected onFamilyNameInput(event: Event): void {
    this.familyName.set((event.target as HTMLInputElement).value);
  }

  protected onYourNameInput(event: Event): void {
    this.yourName.set((event.target as HTMLInputElement).value);
  }

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onSecretWordInput(event: Event): void {
    this.secretWord.set((event.target as HTMLInputElement).value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    if (this.secretWord().trim() !== environment.signupSecretWord) {
      this.errorMessage.set(
        'ひみつのことばが ちがうよ。かんけいしゃに きいてみてね。'
      );
      return;
    }
    if (!this.familyName().trim() || !this.yourName().trim()) {
      this.errorMessage.set(
        'かぞくのなまえと あなたのなまえを にゅうりょくしてね。'
      );
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    try {
      const familyId = await this.authService.signUp(
        this.email().trim(),
        this.password()
      );
      await this.familyService.createFamily(familyId, this.familyName().trim());
      await this.familyService.addFamilyUser(familyId, {
        name: this.yourName().trim(),
        role: 'parent',
        avatarUrl: this.selectedAvatar(),
      });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorMessage.set(this.toErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private toErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/email-already-in-use') {
      return 'そのメールアドレスは すでに つかわれています。';
    }
    if (code === 'auth/weak-password') {
      return 'パスワードは 6もじ いじょうにしてね。';
    }
    if (code === 'auth/invalid-email') {
      return 'メールアドレスの かたちが ただしくないよ。';
    }
    return 'とうろくに しっぱいしました。じかんをおいて もういちど おためしください。';
  }
}
