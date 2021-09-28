const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'kevinkurti93@gmail.com',
        subject: 'Thanks for joining us!',
        text: `Welcome to Task App, ${name}`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'kevinkurti93@gmail.com',
        subject: 'Cancel Membership',
        text: `Sad to see you go, ${name}`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}