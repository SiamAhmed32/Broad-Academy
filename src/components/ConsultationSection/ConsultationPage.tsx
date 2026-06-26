import React from 'react'
import ConsultationImage from './ConsultationImage'
import { Container } from '../reusables'
import ConsultationInfo from './ConsultationInfo'

const ConsultationPage = () => {
  return (
    <div className='py-8 mx-4 bg-navy rounded-lg flex justify-between items-center'>
        <Container className='flex items-center justify-between flex-col md:flex-row'>

        <ConsultationImage/>
        <ConsultationInfo/>
        </Container>
    </div>
  )
}

export default ConsultationPage
