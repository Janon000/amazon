import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from 'micro'
import * as admin from 'firebase-admin'

import serviceAccount from '../../../permissions.json';

import {stripe} from '../../lib/stripe'

const params = { 
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url
}
   
// Secure connection to FIREBASE from the backend
const app = !admin.apps.length 
  ? admin.initializeApp({
      credential: admin.credential.cert(params)
  }) 
  : admin.app()

// Establish connection to Stripe
const endpointSecret = process.env.STRIPE_SIGNING_SECRET

// Push the data to firbase
const fulfillOrder = async (session: any) => {
  console.log('fullfilling order')
  return app
    .firestore()
    .collection('users')
    .doc(session.metadata.email)
    .collection('orders')
    .doc(session.id)
    .set({
      amount: session.amount_total / 100,
      amount_shipping: session.total_details.amount_shipping / 100,
      images: JSON.parse(session.metadata.images),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
    .then( () => {
      console.log(`SUCCESS: Order ${session.id} had been added to the DB`)
    })
}

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) =>{
  if(req.method === 'POST'){
    const requestBuffer = await buffer(req)
    const payload = requestBuffer.toString()
    const sig = req.headers['stripe-signature'] as string | string[]

    let event

    // Verify that event came from stripe
    try{
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)

    }catch(error){
      console.log('ERROR', error)
      return res.status(400).send(`Webhook error: ${error}`)
    }

    // Handle the checkout session completed event

    if(event.type === 'checkout.session.completed'){
      const session = event.data.object
      //Fulfull the order..
      return fulfillOrder(session)
        .then(() => res.status(200))
        .catch((err) => res.status(400).send(`webhook Error: ${err.message}`))
    }
  }

}


// When handling a webhook we don't want a body parser, we want the entire stream of data, and the event will be resolved by stripe
export const config ={
  api:{
    bodyParser: false,
    externalResolver: true
  }
}