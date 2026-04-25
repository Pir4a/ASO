# Stripe — test card numbers

Use these only in **test mode** (the API key on the server starts with `sk_test_…`). They will be rejected in live mode.

For every card below: any **future** expiry (e.g. `12/34`), any **CVC** (3 digits, 4 for Amex), any **ZIP / postal code** (e.g. `12345`).

## Successful payments

| Number              | Brand      | Behavior                                  |
| ------------------- | ---------- | ----------------------------------------- |
| `4242 4242 4242 4242` | Visa       | Succeeds, no 3-D Secure prompt.           |
| `5555 5555 5555 4444` | Mastercard | Succeeds.                                 |
| `3782 822463 10005`   | Amex       | Succeeds (uses a 4-digit CVC).            |
| `6011 1111 1111 1117` | Discover   | Succeeds.                                 |

## 3-D Secure / authentication

| Number              | Behavior                                                       |
| ------------------- | -------------------------------------------------------------- |
| `4000 0025 0000 3155` | Triggers an interactive 3DS challenge that you must approve.   |
| `4000 0027 6000 3184` | 3DS supported — succeeds without challenge in most flows.      |
| `4000 0082 6000 3178` | Authentication required, but the issuer **declines** after.    |

## Declines

| Number              | Decline reason                  |
| ------------------- | ------------------------------- |
| `4000 0000 0000 0002` | Generic decline                 |
| `4000 0000 0000 9995` | Insufficient funds              |
| `4000 0000 0000 9987` | Lost card                       |
| `4000 0000 0000 9979` | Stolen card                     |
| `4000 0000 0000 0069` | Expired card                    |
| `4000 0000 0000 0127` | Incorrect CVC                   |
| `4000 0000 0000 0119` | Processing error                |

## Risk / Radar (only in payment flow with Radar enabled)

| Number              | Behavior                              |
| ------------------- | ------------------------------------- |
| `4100 0000 0000 0019` | Always blocked by Radar (high risk).  |
| `4000 0000 0000 4954` | Always **flagged** as elevated risk.  |

## Saved-card flows on this site

Used at **`/profile → Paiements`** (SetupIntent) and **`/checkout`** (PaymentIntent with `customer` attached, so saved cards appear automatically):

1. Add a card with `4242 4242 4242 4242` → it appears in the list with `last4 = 4242`.
2. On `/checkout`, the `<PaymentElement>` should now offer that saved card.
3. To test the deletion path, remove it from `/profile → Paiements`.

## Reference

Full official list (refunds, disputes, currency-specific cards, etc.):
<https://docs.stripe.com/testing#cards>
