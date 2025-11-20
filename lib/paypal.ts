// @ts-expect-error - No types available for deprecated package
import paypal from '@paypal/checkout-server-sdk'

// PayPal Environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!

  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

// PayPal Client
export function client() {
  return new paypal.core.PayPalHttpClient(environment())
}

// Create PayPal Order for Day Pass
export async function createDayPassOrder(userId: string) {
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: process.env.DAY_PASS_PRICE || '7.00',
        },
        description: `24-Hour Day Pass - ${process.env.DAY_PASS_LEADS_LIMIT || 15} High-Converting Leads`,
        custom_id: userId,
      },
    ],
    application_context: {
      brand_name: 'Lead Finder Pro',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
    },
  })

  try {
    const response = await client().execute(request)
    return {
      orderId: response.result.id,
      approvalUrl: response.result.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href,
    }
  } catch (error) {
    console.error('PayPal Create Order Error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create PayPal order')
  }
}

// Capture PayPal Payment
export async function capturePayment(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId)
  request.requestBody({})

  try {
    const response = await client().execute(request)
    return {
      orderId: response.result.id,
      status: response.result.status,
      payerId: response.result.payer?.payer_id,
      email: response.result.payer?.email_address,
      amount: response.result.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      customId: response.result.purchase_units[0]?.custom_id,
    }
  } catch (error) {
    console.error('PayPal Capture Error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to capture PayPal payment')
  }
}
