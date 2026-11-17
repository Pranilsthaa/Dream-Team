import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";

import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import {
  authFormDefaults,
  authFormResolver,
  type AuthFormValues,
} from "@/features/auth/form";
import { useSignInMutation } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api/api-error";
import { useAuth } from "@/providers/auth-provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthField } from "./auth-field";
import { SquadPreview } from "./squad-preview";

type Mode = "login" | "signup";
const noticeEntrance = FadeIn.duration(160);

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { session } = useAuth();
  const mutation = useSignInMutation();
  const [notice, setNotice] = useState(session.message ?? "");
  const [retryUntil, setRetryUntil] = useState(0);
  const [clock, setClock] = useState(Date.now);
  const cooldown = Math.max(0, Math.ceil((retryUntil - clock) / 1000));
  const requestInFlight = useRef(false);
  const signup = mode === "signup";
  const {
    control,
    handleSubmit,
    setFocus,
    setError,
    clearErrors,
    reset,
    resetField,
    trigger,
    formState: { errors },
  } = useForm<AuthFormValues>({
    defaultValues: authFormDefaults,
    resolver: authFormResolver(signup),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const busy = mutation.isPending;
  const message = errors.root?.server?.message ?? notice;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setClock(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [cooldown, retryUntil]);
  const reducedMotion = useReducedMotion();
  const { bottom } = useSafeAreaInsets();

  function changeMode(nextMode: Mode) {
    if (nextMode === mode || busy || requestInFlight.current) return;
    setMode(nextMode);
    reset(undefined, { keepValues: true });
    setNotice("");
    setPasswordVisible(false);
  }

  function clearFeedback() {
    clearErrors("root.server");
    setNotice("");
  }

  async function onValid(values: AuthFormValues) {
    Keyboard.dismiss();
    try {
      await mutation.mutateAsync(
        signup
          ? {
              mode: "signup",
              input: {
                username: values.username,
                email: values.email,
                password: values.password,
              },
            }
          : {
              mode: "login",
              input: { email: values.email, password: values.password },
            },
      );
      resetField("password", { defaultValue: "" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const now = Date.now();
        setClock(now);
        setRetryUntil(now + (error.retryAfterSeconds ?? 60) * 1000);
      }
      setError("root.server", {
        type: "server",
        message:
          error instanceof ApiError && error.status === 401
            ? "The email or password is incorrect. Please try again."
            : error instanceof Error
              ? error.message
              : "Could not sign in. Please try again.",
      });
    } finally {
      mutation.reset();
    }
  }

  async function submit() {
    if (requestInFlight.current || cooldown > 0) return;
    requestInFlight.current = true;
    clearFeedback();
    try {
      await handleSubmit(onValid, (validationErrors) => {
        const first =
          signup && validationErrors.username
            ? "username"
            : validationErrors.email
              ? "email"
              : "password";
        setFocus(first);
      })();
    } finally {
      requestInFlight.current = false;
    }
  }

  async function forgotPassword() {
    if (requestInFlight.current) return;
    clearFeedback();
    if (!(await trigger("email", { shouldFocus: true }))) return;
    Keyboard.dismiss();
    setNotice("Password reset is coming soon. No reset message has been sent.");
  }
  return (
    <View style={[styles.safeArea, { marginBottom: bottom }]}>
      <StatusBar hidden />
      <KeyboardAwareScrollView
        style={styles.keyboard}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={100}
      >
        <View style={styles.page}>
          <SquadPreview />
          <View style={styles.main}>
            <View style={styles.intro}>
              <Text accessibilityRole="header" style={styles.heading}>
                Your game.{"\n"}Your league.
              </Text>
              <Text style={styles.subtitle}>
                Pick your squad, name a captain, and climb the leaderboard.
              </Text>
            </View>

            <View accessibilityRole="tablist" style={styles.tabs}>
              {(["login", "signup"] as const).map((tab) => (
                <Pressable
                  key={tab}
                  disabled={busy}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: mode === tab,
                    disabled: busy,
                  }}
                  onPress={() => changeMode(tab)}
                  style={({ pressed }) => [
                    styles.tab,
                    mode === tab && styles.selectedTab,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      mode === tab && styles.selectedTabText,
                    ]}
                  >
                    {tab === "login" ? "Log in" : "Sign up"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.form}>
              {signup ? (
                <AuthField
                  control={control}
                  name="username"
                  onEdit={clearFeedback}
                  nativeID="username"
                  label="Username"
                  placeholder="underdog_united"
                  autoComplete="username"
                  autoCapitalize="none"
                  maxLength={30}
                  autoCorrect={false}
                  editable={!busy}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => setFocus("email")}
                />
              ) : null}
              <AuthField
                control={control}
                name="email"
                onEdit={clearFeedback}
                nativeID="identity"
                label="Email"
                placeholder="you@example.com"
                editable={!busy}
                maxLength={254}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => setFocus("password")}
              />
              <AuthField
                control={control}
                name="password"
                onEdit={clearFeedback}
                nativeID="password"
                label="Password"
                placeholder={
                  signup ? "At least 12 characters" : "Your password"
                }
                editable={!busy}
                maxLength={128}
                secureTextEntry={!passwordVisible}
                autoComplete={signup ? "new-password" : "current-password"}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={submit}
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    accessibilityLabel={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    accessibilityState={{ checked: passwordVisible }}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    style={({ pressed }) => [
                      styles.peek,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.peekText}>
                      {passwordVisible ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                }
              />
              {!signup ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={forgotPassword}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.forgot,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              ) : null}
              <View style={signup ? styles.signupAction : undefined}>
                <ActionButton
                  onPress={submit}
                  loading={busy}
                  disabled={cooldown > 0}
                >
                  {busy
                    ? signup
                      ? "Creating account…"
                      : "Signing in…"
                    : cooldown > 0
                      ? `Try again in ${cooldown}s`
                      : signup
                        ? "Create account"
                        : "Enter the game"}
                </ActionButton>
              </View>
              {message ? (
                <Animated.View
                  entering={reducedMotion ? undefined : noticeEntrance}
                  style={styles.notice}
                >
                  <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={styles.noticeText}
                  >
                    {message}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    accessibilityLabel="Dismiss message"
                    onPress={clearFeedback}
                    style={({ pressed }) => [
                      styles.dismiss,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dismissText}>x</Text>
                  </Pressable>
                </Animated.View>
              ) : null}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.or}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <ActionButton
              variant="secondary"
              disabled={busy}
              onPress={() => {
                Keyboard.dismiss();
                clearFeedback();
                setNotice(
                  "Google sign-in is coming soon. Please check back later.",
                );
              }}
              icon={
                <Text accessible={false} style={styles.googleIcon}>
                  G
                </Text>
              }
            >
              Continue with Google
            </ActionButton>
            <Text style={styles.footer}>
              Every sport. Every game. Your kind of league.
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const { colors, fonts, space, size } = theme;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center" },
  page: { width: "100%", maxWidth: size.contentMaxWidth, flexGrow: 1 },
  main: {
    paddingHorizontal: space.xl,
    paddingTop: 26,
    paddingBottom: space.xl,
  },
  intro: { gap: 10, marginBottom: 22 },
  heading: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: 0.2,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 310,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  selectedTab: {
    backgroundColor: colors.accent,
    borderBottomColor: colors.accentShadow,
  },
  tabText: { fontFamily: fonts.display, fontSize: 20, color: colors.textMuted },
  selectedTabText: { color: colors.ink },
  pressed: { opacity: 0.7 },
  form: { gap: 14 },
  peek: {
    minWidth: 56,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  peekText: { fontFamily: fonts.label, fontSize: 13, color: colors.ink },
  forgot: {
    minHeight: 48,
    paddingVertical: 10,
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: -12,
    marginBottom: -8,
  },
  forgotText: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  signupAction: { marginTop: 4 },
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderRadius: 12,
    paddingLeft: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  noticeText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  dismiss: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: { color: colors.textMuted, fontSize: 25 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surface },
  or: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  googleIcon: { color: colors.text, fontFamily: fonts.label, fontSize: 22 },
  footer: {
    marginTop: 22,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: "center",
  },
});
