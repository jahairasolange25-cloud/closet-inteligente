/**
 * Accessibility audit utilities for Closet Inteligente.
 *
 * These are dev-only runtime checks that log a11y violations to the console
 * in development mode. They do NOT run in production.
 */

export interface A11yViolation {
  element: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  recommendation: string;
}

export type A11yAuditResult = A11yViolation[];

export function auditKeyboardTraversal(): A11yAuditResult {
  if (typeof document === 'undefined') return [];

  const violations: A11yAuditResult = [];

  document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach((el) => {
    const htmlEl = el as HTMLElement;

    if (!htmlEl.hasAttribute('tabindex') && !htmlEl.hasAttribute('disabled')) {
      if (htmlEl.tagName === 'A' && !htmlEl.getAttribute('href')) {
        violations.push({
          element: htmlEl.tagName.toLowerCase() + (htmlEl.className ? `.${htmlEl.className.split(' ')[0]}` : ''),
          issue: 'Anchor without href is not keyboard accessible',
          severity: 'error',
          recommendation: 'Add href attribute or use a button element',
        });
      }
    }

    if (htmlEl.getAttribute('tabindex') === '-1') {
      violations.push({
        element: htmlEl.tagName.toLowerCase(),
        issue: 'Element has tabindex="-1", not reachable by keyboard',
        severity: 'warning',
        recommendation: 'Remove tabindex or set to 0 if focusable',
      });
    }

    if (
      htmlEl.tagName === 'BUTTON' &&
      !htmlEl.textContent?.trim() &&
      !htmlEl.getAttribute('aria-label')
    ) {
      violations.push({
        element: 'button',
        issue: 'Button has no accessible name',
        severity: 'error',
        recommendation: 'Add aria-label attribute or visible text content',
      });
    }
  });

  document.querySelectorAll('img').forEach((el) => {
    const img = el as HTMLImageElement;
    if (!img.hasAttribute('alt')) {
      violations.push({
        element: 'img' + (img.src ? `[src="${img.src.slice(0, 30)}..."]` : ''),
        issue: 'Image missing alt attribute',
        severity: 'error',
        recommendation: 'Add descriptive alt text or alt="" for decorative images',
      });
    }
  });

  document.querySelectorAll('[role]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const role = htmlEl.getAttribute('role');
    if (role && !htmlEl.hasAttribute('aria-label') && !htmlEl.textContent?.trim()) {
      violations.push({
        element: `${htmlEl.tagName.toLowerCase()}[role="${role}"]`,
        issue: `Element with role="${role}" has no accessible name`,
        severity: 'warning',
        recommendation: 'Add aria-label or visible label',
      });
    }
  });

  return violations;
}

export function runA11yAudit(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const violations = auditKeyboardTraversal();
  if (violations.length === 0) {
    console.info('[A11y] No accessibility violations detected');
    return;
  }

  console.group('[A11y] Accessibility Violations');
  violations.forEach((v) => {
    const icon = v.severity === 'error' ? '✖' : v.severity === 'warning' ? '⚠' : 'ℹ';
    console.log(`${icon} [${v.severity.toUpperCase()}] ${v.element}: ${v.issue}`);
    console.log(`   → ${v.recommendation}`);
  });
  console.groupEnd();
}

export function getA11yScore(): { score: number; violations: A11yAuditResult } {
  const violations = auditKeyboardTraversal();
  const errors = violations.filter((v) => v.severity === 'error').length;
  const warnings = violations.filter((v) => v.severity === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - errors * 10 - warnings * 3));
  return { score, violations };
}
