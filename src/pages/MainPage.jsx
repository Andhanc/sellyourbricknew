import { useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import './MainPage.css'
import {
  FiBell,
  FiSearch,
  FiSliders,
  FiHeart,
  FiChevronDown,
  FiArrowRight,
  FiArrowLeft,
  FiShare2,
  FiX,
  FiSend,
  FiGlobe,
  FiPhone,
  FiMap,
  FiMenu,
  FiUser,
  FiCheck,
  FiStar,
  FiMail,
} from 'react-icons/fi'
import {
  FaHome,
  FaHeart,
  FaHeart as FaHeartSolid,
  FaGavel,
  FaComment,
  FaUser,
  FaAndroid,
  FaApple,
  FaWhatsapp,
  FaInstagram,
  FaYoutube,
  FaCar,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import {
  PiHouseLine,
  PiBuildings,
  PiBuildingApartment,
  PiBuilding,
  PiWarehouse,
} from 'react-icons/pi'
import PropertyTimer from '../components/PropertyTimer'
import '../components/PropertyList.css'

const resortLocations = [
  'Costa Adeje, Tenerife',
  'Playa de las Américas, Tenerife',
  'Los Cristianos, Tenerife',
  'Puerto de la Cruz, Tenerife',
  'Santa Cruz de Tenerife, Tenerife',
  'La Laguna, Tenerife',
  'San Cristóbal de La Laguna, Tenerife',
  'Golf del Sur, Tenerife',
  'Callao Salvaje, Tenerife',
  'El Médano, Tenerife',
]

const recommendedProperties = [
  {
    id: 1,
    tag: 'House',
    name: 'Lakeshore Blvd West',
    location: '70 Washington Square South, New York, NY 10012, United States',
    price: 797500,
    coordinates: [28.2916, -16.6291], // Costa Adeje, Tenerife
    image:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 2000,
    isAuction: true,
    currentBid: 750000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Роскошная недвижимость в самом сердце Манхэттена. Современная квартира с панорамными видами на город. Рядом находятся лучшие рестораны, магазины и культурные достопримечательности. Идеальное расположение для тех, кто ценит комфорт и престиж.',
    owner: { firstName: 'Джон', lastName: 'Смит' },
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
  {
    id: 2,
    tag: 'House',
    name: 'Eleanor Pena Property',
    location: 'Costa Adeje, Tenerife, Spain',
    price: 1200,
    coordinates: [28.1000, -16.7200], // Playa de las Américas, Tenerife
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 1,
    sqft: 1500,
    isAuction: true,
    currentBid: 1100,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Прекрасная вилла в элитном районе Коста-Адехе. Современный дизайн, просторные террасы с видом на океан. Рядом находятся лучшие пляжи, гольф-клубы и рестораны. Идеальное место для отдыха и жизни на Тенерифе.',
    owner: { firstName: 'Карлос', lastName: 'Родригес' },
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
]

const nearbyProperties = [
  {
    id: 1,
    tag: 'House',
    name: 'Bessie Cooper Property',
    location: 'Los Cristianos, Tenerife, Spain',
    price: 1000,
    coordinates: [28.0500, -16.7167], // Los Cristianos, Tenerife
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 1800,
    isAuction: true,
    currentBid: 950,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Уютный дом в Лос-Кристианос, одном из самых популярных курортов Тенерифе. Близость к пляжу, магазинам и ресторанам. Тихое место с прекрасным климатом круглый год. Отличный вариант для постоянного проживания или отдыха.',
    owner: { firstName: 'Мария', lastName: 'Гонсалес' },
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
  {
    id: 2,
    tag: 'Apartment',
    name: 'Darrell Steward Property',
    location: 'Puerto de la Cruz, Tenerife, Spain',
    price: 980,
    coordinates: [28.4167, -16.5500], // Puerto de la Cruz, Tenerife
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 1,
    baths: 1,
    sqft: 1200,
    isAuction: true,
    currentBid: 920,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Светлая квартира в историческом Пуэрто-де-ла-Крус. Уникальное расположение на севере острова с мягким климатом. Рядом ботанический сад, пляжи с черным песком и множество достопримечательностей. Идеально для тех, кто любит спокойствие и природу.',
    owner: { firstName: 'Антонио', lastName: 'Мартинес' },
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
]

const apartmentsData = [
  {
    id: 1,
    name: 'Тропарево Парк',
    location: 'Costa Adeje, Tenerife',
    price: 8500372,
    coordinates: [28.2916, -16.6291],
    owner: { firstName: 'Хосе', lastName: 'Мендес' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 8000000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 2,
    baths: 1,
    sqft: 850,
    description:
      'Современная квартира в престижном районе Коста-Адехе. Элитный комплекс с бассейном и инфраструктурой. Рядом лучшие пляжи острова, гольф-поля и рестораны высокой кухни. Идеальное место для инвестиций и отдыха.',
  },
  {
    id: 2,
    name: 'Клубный город на реке Primavera',
    location: 'Playa de las Américas, Tenerife',
    price: 25748010,
    coordinates: [28.1000, -16.7200],
    owner: { firstName: 'Хуан', lastName: 'Лопес' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 24000000,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 3,
    baths: 2,
    sqft: 1200,
    description:
      'Роскошная квартира в самом центре Плайя-де-лас-Америкас. Шаговую доступность до пляжей, ночных клубов и развлечений. Современный дизайн, все удобства. Отличное место для активного отдыха и жизни на курорте.',
  },
  {
    id: 3,
    name: 'Slava',
    location: 'Los Cristianos, Tenerife',
    price: 28078032,
    coordinates: [28.0500, -16.7167],
    owner: { firstName: 'Педро', lastName: 'Санчес' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 26000000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 1,
    baths: 1,
    sqft: 650,
    description:
      'Компактная уютная квартира в Лос-Кристианос. Идеальный вариант для первого жилья или инвестиций. Рядом пляж, магазины и транспортная развязка. Отличное соотношение цены и качества в популярном курортном районе.',
  },
  {
    id: 4,
    name: 'Пригород Лесное',
    location: 'Puerto de la Cruz, Tenerife',
    price: 4441729,
    coordinates: [28.4167, -16.5500],
    owner: { firstName: 'Изабель', lastName: 'Фернандес' },
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 4200000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 2,
    baths: 1,
    sqft: 950,
    description:
      'Прекрасная квартира в Пуэрто-де-ла-Крус с видом на океан. Исторический район с уникальной архитектурой. Рядом ботанический сад, термальные бассейны и пляжи. Идеально для тех, кто ценит спокойствие и близость к природе.',
  },
  {
    id: 5,
    name: 'LUZHNIKI COLLECTION',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 71874000,
    coordinates: [28.4636, -16.2518],
    owner: { firstName: 'Мигель', lastName: 'Торрес' },
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 68000000,
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 4,
    baths: 3,
    sqft: 1800,
    description:
      'Элитная квартира в столице Тенерифе - Санта-Крус. Престижный район с развитой инфраструктурой. Рядом деловой центр, культурные достопримечательности и лучшие рестораны. Идеально для бизнеса и постоянного проживания.',
  },
  {
    id: 6,
    name: 'SHIFT',
    location: 'La Laguna, Tenerife',
    price: 40824208,
    coordinates: [28.4853, -16.3200],
    owner: { firstName: 'Кармен', lastName: 'Руис' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 38500000,
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 3,
    baths: 2,
    sqft: 1400,
    description:
      'Современная квартира в историческом городе Ла-Лагуна, объекте Всемирного наследия ЮНЕСКО. Университетский город с богатой культурой. Рядом старый город, музеи и кафе. Идеально для студентов и любителей истории.',
  },
]

const villasData = [
  {
    id: 1,
    name: 'Villa Paradise',
    location: 'Costa Adeje, Tenerife',
    price: 12000000,
    coordinates: [28.2916, -16.6291],
    owner: { firstName: 'Франсиско', lastName: 'Гарсия' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 11000000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 4,
    baths: 3,
    sqft: 2500,
    description:
      'Роскошная вилла в элитном районе Коста-Адехе с панорамным видом на океан. Частный бассейн, террасы, современная кухня. Рядом лучшие пляжи, гольф-клубы и рестораны. Идеальное место для роскошного отдыха и жизни.',
  },
  {
    id: 2,
    name: 'Luxury Beach Villa',
    location: 'Playa de las Américas, Tenerife',
    price: 18500000,
    coordinates: [28.1000, -16.7200],
    owner: { firstName: 'Анна', lastName: 'Морено' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 17500000,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 5,
    baths: 4,
    sqft: 3200,
    description:
      'Эксклюзивная вилла на первой линии пляжа в Плайя-де-лас-Америкас. Прямой выход к океану, частный пляж, бассейн с подогревом. Роскошный интерьер, современная техника. Идеально для тех, кто ищет премиум недвижимость.',
  },
  {
    id: 3,
    name: 'Ocean View Villa',
    location: 'Los Cristianos, Tenerife',
    price: 22000000,
    coordinates: [28.0500, -16.7167],
    owner: { firstName: 'Луис', lastName: 'Хименес' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 21000000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 6,
    baths: 5,
    sqft: 4000,
    description:
      'Великолепная вилла с видом на океан в Лос-Кристианос. Просторные террасы, сад, бассейн. Рядом пляжи, рестораны и развлечения. Идеальное место для большой семьи или приема гостей. Прекрасный климат круглый год.',
  },
  {
    id: 4,
    name: 'Mountain Retreat',
    location: 'Puerto de la Cruz, Tenerife',
    price: 9500000,
    coordinates: [28.4167, -16.5500],
    owner: { firstName: 'Элена', lastName: 'Васкес' },
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 9000000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 3,
    baths: 2,
    sqft: 2000,
    description:
      'Уютная вилла в горах Пуэрто-де-ла-Крус с видом на вулкан Тейде. Тишина и покой, близость к природе. Рядом термальные источники и ботанический сад. Идеально для тех, кто ищет уединение и спокойствие.',
  },
  {
    id: 5,
    name: 'Elite Collection Villa',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 35000000,
    coordinates: [28.4636, -16.2518],
    owner: { firstName: 'Роберто', lastName: 'Альварес' },
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 33000000,
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 7,
    baths: 6,
    sqft: 5000,
    description:
      'Эксклюзивная вилла в столице Тенерифе - Санта-Крус. Премиум локация с видом на океан и город. Роскошный интерьер, современная архитектура, частный сад и бассейн. Идеально для представительских целей и роскошной жизни.',
  },
  {
    id: 6,
    name: 'Modern Villa Design',
    location: 'La Laguna, Tenerife',
    price: 28000000,
    coordinates: [28.4853, -16.3200],
    owner: { firstName: 'София', lastName: 'Рамос' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 26500000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 5,
    baths: 4,
    sqft: 3500,
    description:
      'Современная вилла в историческом городе Ла-Лагуна. Уникальный дизайн сочетает современность и традиции. Рядом старый город, университет и культурные достопримечательности. Идеально для тех, кто ценит культуру и комфорт.',
  },
]

function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState(resortLocations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [propertyMode, setPropertyMode] = useState('buy') // 'rent' для аренды, 'buy' для покупки
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    // Загружаем из localStorage
    const savedFavorites = localStorage.getItem('favoriteProperties')
    let initialFavorites = new Map()
    
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        initialFavorites = new Map(Object.entries(parsed))
      } catch (e) {
        console.error('Ошибка при загрузке избранного:', e)
      }
    }
    
    // Инициализируем все свойства, если их еще нет
    recommendedProperties.forEach((property) => {
      if (!initialFavorites.has(`recommended-${property.id}`)) {
        initialFavorites.set(`recommended-${property.id}`, false)
      }
    })
    nearbyProperties.forEach((property) => {
      if (!initialFavorites.has(`nearby-${property.id}`)) {
        initialFavorites.set(`nearby-${property.id}`, false)
      }
    })
    apartmentsData.forEach((property) => {
      if (!initialFavorites.has(`apartment-${property.id}`)) {
        initialFavorites.set(`apartment-${property.id}`, false)
      }
    })
    villasData.forEach((property) => {
      if (!initialFavorites.has(`villa-${property.id}`)) {
        initialFavorites.set(`villa-${property.id}`, false)
      }
    })
    
    return initialFavorites
  })
  const [activeNav, setActiveNav] = useState('home')
  const [contactForm, setContactForm] = useState({
    email: '',
    fullName: '',
    message: '',
  })
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  
  // Инициализируем первое сообщение бота при загрузке
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: 1,
        text: t('aiGreeting'),
        sender: 'bot',
        timestamp: new Date(),
      }])
    }
  }, [i18n.language, t, chatMessages.length])
  
  // Отладочная информация о состоянии i18n
  useEffect(() => {
    console.log('🌐 i18n initialized:', i18n.isInitialized)
    console.log('🌐 Current language:', i18n.language)
    console.log('🌐 Available languages:', i18n.languages)
    console.log('🌐 Test translation (home):', t('home'))
  }, [i18n.language, i18n.isInitialized, t])
  
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filteredProperties, setFilteredProperties] = useState(null)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [activeFilter, setActiveFilter] = useState(t('forAll'))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const locationRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const notificationRef = useRef(null)
  const menuRef = useRef(null)
  const languageDropdownRef = useRef(null)

  const heroImages = {
    rent: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    buy: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  }
  
  const heroImage = heroImages[propertyMode]
  

  // Чтение URL параметров и применение фильтров
  useEffect(() => {
    try {
      if (!location) {
        return
      }

      const searchParams = new URLSearchParams(location.search)
      const category = searchParams.get('category')
      const filter = searchParams.get('filter')

      if (category) {
        setIsLoading(true)
        setActiveCategory(category)

        const timeoutId = setTimeout(() => {
          try {
            let filteredRecommended = recommendedProperties
            let filteredNearby = nearbyProperties

            if (category === 'House') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'house'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'house'
              )
            } else if (category === 'Apartment') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'apartment'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'apartment'
              )
            } else if (category === 'Villa') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'villa'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'villa'
              )
            }

            // Если есть фильтр аукциона, применяем его
            if (filter === 'auction') {
              filteredRecommended = filteredRecommended.filter((p) => p && p.isAuction === true)
              filteredNearby = filteredNearby.filter((p) => p && p.isAuction === true)
            }

            setFilteredProperties({
              recommended: filteredRecommended,
              nearby: filteredNearby,
            })
            setIsLoading(false)
          } catch (error) {
            console.error('Error filtering properties:', error)
            setIsLoading(false)
          }
        }, 500)

        return () => {
          clearTimeout(timeoutId)
        }
      } else {
        // Если нет параметров, сбрасываем фильтры
        setFilteredProperties(null)
        setActiveCategory(null)
      }
    } catch (error) {
      console.error('Error reading URL parameters:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    // Проверяем ширину экрана для десктопа
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', checkDesktop)
    }
  }, [])

  // Закрытие меню обрабатывается через backdrop onClick

  // Изменяем overflow body когда меню открыто (но не фон, чтобы не было белого экрана)
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMenuOpen])


  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setIsLocationOpen(false)
  }

  const toggleFavorite = (category, id) => {
    const key = `${category}-${id}`
    setFavoriteProperties((prev) => {
      const updated = new Map(prev)
      updated.set(key, !prev.get(key))
      
      // Сохраняем в localStorage
      const obj = Object.fromEntries(updated)
      localStorage.setItem('favoriteProperties', JSON.stringify(obj))
      
      return updated
    })
  }

  const handleContactFormChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContactFormSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', contactForm)
    setContactForm({
      email: '',
      fullName: '',
      message: '',
    })
    alert(t('thankYouMessage'))
  }

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value)
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput('')

    setChatMessages((prev) => {
      const newMessage = {
        id: prev.length + 1,
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
      }

      // Имитация ответа бота
      setTimeout(() => {
        setChatMessages((current) => {
          const botResponse = {
            id: current.length + 1,
            text: i18n.t('aiResponse'),
            sender: 'bot',
            timestamp: new Date(),
          }
          return [...current, botResponse]
        })
      }, 1000)

      return [...prev, newMessage]
    })
  }

  useEffect(() => {
    if (chatMessagesRef.current && isChatOpen) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages, isChatOpen])

  const languages = [
    { code: 'ru', name: 'Русский', flagClass: 'footer__flag--ru' },
    { code: 'en', name: 'English', flagClass: 'footer__flag--gb' },
    { code: 'de', name: 'Deutsch', flagClass: 'footer__flag--de' },
    { code: 'es', name: 'Español', flagClass: 'footer__flag--es' },
    { code: 'fr', name: 'Français', flagClass: 'footer__flag--fr' },
    { code: 'sv', name: 'Svenska', flagClass: 'footer__flag--sv' },
  ]

  const handleLanguageChange = async (langCode) => {
    try {
      console.log('🔄 Changing language to:', langCode)
      console.log('📊 Current i18n language before change:', i18n.language)
      console.log('📊 i18n ready:', i18n.isInitialized)
      
      // Меняем язык в i18n - это обновит весь статический контент
      await i18n.changeLanguage(langCode)
      
      console.log('✅ Language changed to:', i18n.language)
      console.log('📝 Test translation (home):', t('home'))
      console.log('📝 Test translation (recommended):', t('recommended'))
      
      setIsLanguageDropdownOpen(false)
    } catch (error) {
      console.error('❌ Error changing language:', error)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]
  
  // Функции для получения переведенных элементов (обновляются при смене языка)
  const getPropertyTypes = useMemo(() => {
    console.log('🔄 Updating getPropertyTypes, language:', i18n.language)
    return [
      { label: 'House', displayLabel: t('house'), icon: PiHouseLine, image: '/house.png' },
      { label: 'Map', displayLabel: t('map'), icon: FiMap, isMap: true, image: '/map.png' },
      { label: 'Apartment', displayLabel: t('apartment'), icon: PiBuildingApartment, image: '/appartaments.png' },
      { label: 'Villa', displayLabel: t('villa'), icon: PiBuildings, image: '/villa.png' },
    ]
  }, [t, i18n.language])
  
  const navigationItems = useMemo(() => {
    console.log('🔄 Updating navigationItems, language:', i18n.language)
    return [
      { id: 'home', label: t('home'), icon: FaHome },
      { id: 'favourite', label: t('favorites'), icon: FaHeartSolid },
      { id: 'auction', label: t('auction'), icon: FaGavel },
      { id: 'chat', label: t('chat'), icon: FaComment },
      { id: 'profile', label: t('profile'), icon: FaUser },
    ]
  }, [t, i18n.language])
  
  // Автоматический перевод пользовательского контента отключен из-за лимитов API
  // Статический контент переводится через i18next

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageDropdownOpen(false)
      }
    }

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLanguageDropdownOpen])

  const handleCategoryClick = (categoryLabel) => {
    if (categoryLabel === 'Map') {
      navigate('/map')
      return
    }

    setIsLoading(true)
    setActiveCategory(categoryLabel)
    
    // Обновляем URL с параметрами фильтра
    navigate(`/main?category=${categoryLabel}`, { replace: true })

    setTimeout(() => {
      // Фильтруем объявления по типу
      let filteredRecommended = recommendedProperties
      let filteredNearby = nearbyProperties

      if (categoryLabel === 'House') {
        // Фильтруем только дома
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'house'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'house'
        )
      } else if (categoryLabel === 'Apartment') {
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'apartment'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'apartment'
        )
      } else if (categoryLabel === 'Villa') {
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'villa'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'villa'
        )
      }

      setFilteredProperties({
        recommended: filteredRecommended,
        nearby: filteredNearby,
      })
      setIsLoading(false)
    }, 2000)
  }

  const handleSocialLink = (platform) => {
    const links = {
      instagram: 'https://instagram.com/',
      whatsapp: 'https://wa.me/79991234567',
      youtube: 'https://youtube.com/',
      twitter: 'https://twitter.com/',
    }
    if (links[platform]) {
      window.open(links[platform], '_blank')
    }
  }

  const handleDownloadApp = (platform) => {
    if (platform === 'android') {
      window.open('https://play.google.com/store/apps', '_blank')
    } else if (platform === 'ios') {
      window.open('https://apps.apple.com/', '_blank')
    }
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/79991234567', '_blank')
  }

  const handleCallManager = () => {
    window.location.href = 'tel:+79991234567'
  }

  const handlePropertyClick = (category, propertyId) => {
    navigate(`/property/${propertyId}`)
  }

  const handleBackClick = () => {
    setSelectedProperty(null)
  }

  const togglePropertyFavorite = () => {
    if (selectedProperty) {
      const key = `${selectedProperty.category}-${selectedProperty.id}`
      setFavoriteProperties((prev) => {
        const updated = new Map(prev)
        updated.set(key, !prev.get(key))
        return updated
      })
    }
  }

  const handleShare = () => {
    if (navigator.share && selectedProperty) {
      navigator
        .share({
          title: selectedProperty.name,
          text: selectedProperty.description,
          url: window.location.href,
        })
        .catch(() => {
          // Fallback если share не поддерживается
        })
    }
  }

  const handleBookNow = () => {
    // Обработчик бронирования
    alert('Функция бронирования будет реализована позже')
  }

  const handleCallBroker = () => {
    if (selectedProperty?.broker?.phone) {
      window.location.href = `tel:${selectedProperty.broker.phone}`
    }
  }

  const handleChatBroker = () => {
    // Обработчик чата с брокером
    alert('Чат с брокером будет реализован позже')
  }

  // Получаем все свойства для карты
  const allPropertiesForMap = [
    ...recommendedProperties.map((p) => ({ ...p, category: 'recommended' })),
    ...nearbyProperties.map((p) => ({ ...p, category: 'nearby' })),
  ]

  // Проверка на ошибки рендеринга
  if (!recommendedProperties || !nearbyProperties) {
    return <div className="app">Загрузка...</div>
  }

  return (
    <div className="app">
      <section className="hero-section">
        <div className={`hero-section__image hero-section__image--rent ${propertyMode === 'rent' ? 'hero-section__image--active' : ''}`} style={{ backgroundImage: `url(${heroImages.rent})` }}></div>
        <div className={`hero-section__image hero-section__image--buy ${propertyMode === 'buy' ? 'hero-section__image--active' : ''}`} style={{ backgroundImage: `url(${heroImages.buy})` }}></div>
        <div className="hero-section__overlay"></div>
        <div className="hero-section__content">
          {/* Старый хедер для мобильной версии */}
          <header className="header">
            <div className="header__location">
              <span className="header__location-icon">
                <IoLocationOutline size={20} />
              </span>
              <div className="header__location-info" ref={locationRef}>
                <span className="header__location-label">{t('location')}</span>
                <button
                  type="button"
                  className="header__location-select"
                  onClick={() => setIsLocationOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isLocationOpen}
                >
                  <span className="header__location-value">{selectedLocation}</span>
                  <FiChevronDown
                    size={16}
                    className={`header__location-select-icon ${
                      isLocationOpen ? 'header__location-select-icon--open' : ''
                    }`}
                  />
                </button>
                {isLocationOpen && (
                  <div className="header__location-dropdown">
                    {resortLocations.map((location) => (
                      <button
                        type="button"
                        className={`header__location-option ${
                          location === selectedLocation ? 'header__location-option--active' : ''
                        }`}
                        key={location}
                        onClick={() => handleLocationSelect(location)}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="header__actions" ref={notificationRef}>
              <button 
                type="button" 
                className="header__action-btn"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                aria-expanded={isNotificationOpen}
              >
                <FiBell size={18} />
                <span className="header__action-indicator" />
              </button>
              {isNotificationOpen && (
                <>
                  <div 
                    className="notification-backdrop"
                    onClick={() => setIsNotificationOpen(false)}
                  />
                  <div className="notification-panel">
                    <div className="notification-panel__content">
                      <div className="notification-panel__header">
                        <h3 className="notification-panel__title">Уведомления</h3>
                        <button 
                          type="button" 
                          className="notification-panel__close"
                          onClick={() => setIsNotificationOpen(false)}
                          aria-label="Закрыть уведомления"
                        >
                          <FiX size={20} />
                        </button>
                      </div>
                      <div className="notification-panel__list">
                        <div className="notification-item notification-item--property">
                          <div className="notification-item__content">
                            <h4 className="notification-item__title">{t('foundProperty')}</h4>
                            <div className="notification-item__property">
                              <div className="notification-item__image">
                                <img 
                                  src={recommendedProperties[0].image}
                                  alt={recommendedProperties[0].name}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                                  }}
                                />
                              </div>
                              <div className="notification-item__info">
                                <p className="notification-item__property-name">{recommendedProperties[0].name}</p>
                                <p className="notification-item__property-location">{recommendedProperties[0].location}</p>
                                <button 
                                  type="button" 
                                  className="notification-item__button"
                                  onClick={() => {
                                    setIsNotificationOpen(false)
                                    navigate(`/property/${recommendedProperties[0].id}`)
                                  }}
                                >
                                  {t('goTo')}
                                  <FiArrowRight size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <button 
                type="button" 
                className="header__action-btn"
                onClick={() => navigate('/profile')}
                aria-label={t('profile')}
              >
                <FiUser size={18} />
              </button>
            </div>
          </header>

          {/* Новый хедер для десктопной версии */}
          <header className={`new-header ${isMenuOpen ? 'new-header--menu-open' : ''}`}>
        <div className={`new-header__container ${isMenuOpen ? 'new-header__container--menu-open' : ''}`}>
        <div className="new-header__left">
          <div className="new-header__location">
            <span className="new-header__location-icon">
              <IoLocationOutline size={20} />
            </span>
            <div className="new-header__location-info" ref={locationRef}>
              <span className="new-header__location-label">{t('location')}</span>
              <button
                type="button"
                className="new-header__location-select"
                onClick={() => setIsLocationOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isLocationOpen}
              >
                <span className="new-header__location-value">{selectedLocation}</span>
                <FiChevronDown
                  size={16}
                  className={`new-header__location-select-icon ${
                    isLocationOpen ? 'new-header__location-select-icon--open' : ''
                  }`}
                />
              </button>
            {isLocationOpen && (
              <div className="new-header__location-dropdown">
                {resortLocations.map((location) => (
                  <button
                    type="button"
                    className={`new-header__location-option ${
                      location === selectedLocation ? 'new-header__location-option--active' : ''
                    }`}
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
          <div className={`new-header__menu-wrapper ${isMenuOpen ? 'new-header__menu-wrapper--active' : ''}`} ref={menuRef}>
            <button 
              className={`new-header__menu-btn ${isMenuOpen ? 'new-header__menu-btn--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation() // Останавливаем всплытие события
                e.preventDefault() // Предотвращаем стандартное поведение
                setIsMenuOpen((prev) => !prev)
              }}
              aria-label="Меню"
              aria-expanded={isMenuOpen}
            >
              <FiMenu size={20} className="new-header__menu-icon" />
              <span>Меню</span>
            </button>
          </div>
          
          {/* Модальное окно меню рендерится вне menu-wrapper */}
          {isMenuOpen && (
            <>
              <div 
                className="menu-backdrop"
                onClick={(e) => {
                  // Закрываем меню при клике на backdrop
                  // Проверяем, что клик не по кнопке меню или самому меню
                  const menuBtn = menuRef.current?.querySelector('.new-header__menu-btn')
                  const menuDropdown = document.querySelector('.menu-dropdown')
                  
                  if (menuBtn && menuBtn.contains(e.target)) {
                    // Клик по кнопке меню - не закрываем, кнопка сама переключит состояние
                    return
                  }
                  
                  if (menuDropdown && menuDropdown.contains(e.target)) {
                    // Клик по меню - не закрываем
                    return
                  }
                  
                  // Клик по backdrop - закрываем меню
                  setIsMenuOpen(false)
                }}
              />
              <div 
                className="menu-dropdown" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="menu-dropdown__content">
                  <div className="menu-dropdown__columns">
                    <div className="menu-dropdown__column">
                      <button className="menu-dropdown__item">
                        <span>Недвижимость</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Покупка</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Аренда</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Продажа</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Ипотека</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Карты</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Вклады</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Инвестиции</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Платежи</span>
                      </button>
                    </div>
                    <div className="menu-dropdown__column">
                      <button className="menu-dropdown__item">
                        <span>Премиум</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Бонусы</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Поддержка</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Приложения</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Автолюбителям</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Страхование</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Курсы валют</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Офисы и банкоматы</span>
                      </button>
                      <button className="menu-dropdown__item">
                        <span>Переводы</span>
                      </button>
                    </div>
                  </div>
                  <div className="menu-dropdown__right">
                    <div className="menu-dropdown__icons">
                      <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="menu-dropdown__icon-item"
                      >
                        <div className="menu-dropdown__icon-box menu-dropdown__icon-box--instagram">
                          <FaInstagram size={24} />
                        </div>
                        <span className="menu-dropdown__icon-label">Instagram</span>
                      </a>
                      <a 
                        href="https://wa.me" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="menu-dropdown__icon-item"
                      >
                        <div className="menu-dropdown__icon-box menu-dropdown__icon-box--whatsapp">
                          <FaWhatsapp size={24} />
                        </div>
                        <span className="menu-dropdown__icon-label">WhatsApp</span>
                      </a>
                      <a 
                        href="mailto:info@example.com" 
                        className="menu-dropdown__icon-item"
                      >
                        <div className="menu-dropdown__icon-box menu-dropdown__icon-box--gmail">
                          <FiMail size={24} />
                        </div>
                        <span className="menu-dropdown__icon-label">Email</span>
                      </a>
                      <a 
                        href="tel:+1234567890" 
                        className="menu-dropdown__icon-item"
                      >
                        <div className="menu-dropdown__icon-box menu-dropdown__icon-box--phone">
                          <FiPhone size={24} />
                        </div>
                        <span className="menu-dropdown__icon-label">Позвонить</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

            <div className="new-header__filters">
              <button
                type="button"
                className={`new-header__filter-btn ${location.pathname === '/chat' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => navigate('/chat')}
              >
                <span>{t('chat')}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${location.pathname === '/history' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => navigate('/history')}
              >
                <span>{t('favorites')}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${isChatOpen ? 'new-header__filter-btn--active' : ''}`}
                onClick={toggleChat}
              >
                <span>{t('aiAssistant') || 'Умный помощник'}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${location.pathname === '/map' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => navigate('/map')}
              >
                <span>{t('map')}</span>
              </button>
            </div>

        <div className="new-header__right">
          <button className="new-header__search-btn">
            <FiSearch size={20} />
          </button>
          <button 
            type="button"
            className="new-header__auction-btn"
            onClick={() => navigate('/')}
          >
            {t('auction')}
          </button>
          <button className="new-header__user-btn">
            <FiUser size={20} />
          </button>
          <button 
            type="button" 
            className="new-header__notification-btn"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-expanded={isNotificationOpen}
          >
            <FiBell size={20} />
            <span className="new-header__notification-indicator" />
          </button>
          {isNotificationOpen && (
            <>
              <div 
                className="notification-backdrop"
                onClick={() => setIsNotificationOpen(false)}
              />
              <div className="notification-panel">
                <div className="notification-panel__content">
                <div className="notification-panel__header">
                  <h3 className="notification-panel__title">Уведомления</h3>
                  <button 
                    type="button" 
                    className="notification-panel__close"
                    onClick={() => setIsNotificationOpen(false)}
                    aria-label="Закрыть уведомления"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="notification-panel__list">
                  <div className="notification-item notification-item--property">
                    <div className="notification-item__content">
                      <h4 className="notification-item__title">Нашли для вас объявление!</h4>
                      <div className="notification-item__property">
                        <div className="notification-item__image">
                          <img 
                            src={recommendedProperties[0].image}
                            alt={recommendedProperties[0].name}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                            }}
                          />
                        </div>
                        <div className="notification-item__info">
                          <p className="notification-item__property-name">{recommendedProperties[0].name}</p>
                          <p className="notification-item__property-location">{recommendedProperties[0].location}</p>
                          <button 
                            type="button" 
                            className="notification-item__button"
                            onClick={() => {
                              setIsNotificationOpen(false)
                              handlePropertyClick('recommended', recommendedProperties[0].id)
                            }}
                          >
                            Перейти
                            <FiArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
        </div>
      </header>
        </div>

      <section className="search">
        <div className="search__field">
          <FiSearch size={18} className="search__icon" />
          <input
            type="text"
            placeholder={t('search')}
            className="search__input"
          />
          <button type="button" className="search__filter">
            <FiSliders size={18} />
          </button>
        </div>
      </section>
      </section>


      {/* Блок "Аппартаменты" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div 
            className="apartments-section__header"
            onClick={() => {
              // Принудительный переход на страницу с фильтром
              window.location.href = '/main?category=Apartment&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">{t('apartmentsSection')}</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {apartmentsData.map((apartment) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `${(price / 1000000).toFixed(1)} млн Р`
                  }
                  return `${price.toLocaleString('ru-RU')} Р`
                }
                
                return (
                  <div key={apartment.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        // Принудительный переход на страницу с фильтром
                        window.location.href = '/main?category=Apartment&filter=auction'
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={apartment.image} 
                          alt={apartment.name}
                          className="property-image"
                        />
                        {apartment.endTime && (
                          <div className="property-timer-overlay">
                            <PropertyTimer endTime={apartment.endTime} compact={true} />
                          </div>
                        )}
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`apartment-${apartment.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('apartment', apartment.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`apartment-${apartment.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        <h3 className="property-title">{apartment.name}</h3>
                        <p className="property-location">{apartment.location}</p>
                        <div className="property-price">{formatPrice(apartment.price)}</div>
                        {apartment.currentBid && (
                          <div className="property-bid-info">
                            <span className="bid-label">Текущая ставка:</span>
                            <span className="bid-value">{formatPrice(apartment.currentBid)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="apartments-section__personal">
              <div className="personal-selection">
                <div className="personal-selection__banner">
                  <FiStar className="personal-selection__banner-icon" size={14} />
                  ПЕРСОНАЛЬНАЯ
                </div>
                <div className="personal-selection__content">
                  <div className="personal-selection__decorative">
                    <div className="personal-selection__icon personal-selection__icon--1">
                      <PiBuildingApartment size={32} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--2">
                      <FiHeart size={24} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--3">
                      <FiCheck size={20} />
                    </div>
                  </div>
                  <h3 className="personal-selection__title">ПОДБОРКА</h3>
                  <h3 className="personal-selection__title">АППАРТАМЕНТОВ</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок "Виллы" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div 
            className="apartments-section__header"
            onClick={() => {
              window.location.href = '/main?category=Villa&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">{t('villasSection')}</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {villasData.map((villa) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `${(price / 1000000).toFixed(1)} млн Р`
                  }
                  return `${price.toLocaleString('ru-RU')} Р`
                }
                
                return (
                  <div key={villa.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        window.location.href = '/main?category=Villa&filter=auction'
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={villa.image} 
                          alt={villa.name}
                          className="property-image"
                        />
                        {villa.endTime && (
                          <div className="property-timer-overlay">
                            <PropertyTimer endTime={villa.endTime} compact={true} />
                          </div>
                        )}
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`villa-${villa.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('villa', villa.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`villa-${villa.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        <h3 className="property-title">{villa.name}</h3>
                        <p className="property-location">{villa.location}</p>
                        <div className="property-price">{formatPrice(villa.price)}</div>
                        {villa.currentBid && (
                          <div className="property-bid-info">
                            <span className="bid-label">Текущая ставка:</span>
                            <span className="bid-value">{formatPrice(villa.currentBid)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="apartments-section__personal">
              <div className="personal-selection">
                <div className="personal-selection__banner">
                  <FiStar className="personal-selection__banner-icon" size={14} />
                  ПЕРСОНАЛЬНАЯ
                </div>
                <div className="personal-selection__content">
                  <div className="personal-selection__decorative">
                    <div className="personal-selection__icon personal-selection__icon--1">
                      <PiBuildings size={32} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--2">
                      <FiHeart size={24} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--3">
                      <FiCheck size={20} />
                    </div>
                  </div>
                  <h3 className="personal-selection__title">ПОДБОРКА</h3>
                  <h3 className="personal-selection__title">ВИЛЛ</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Форма обратной связи */}
      <section className="contact-form-section">
        <div className="contact-form-container">
          <div className="contact-form-wrapper">
            <div className="contact-form__image-wrapper">
              <h2 className="contact-form__image-title">{t('haveQuestions')}</h2>
              <div className="contact-form__image">
                <img 
                  src="https://static.cdn-cian.ru/frontend/valuation-my-home-page-frontend/card_6_1.9222208e0e2f6d4d.svg" 
                  alt="Contact illustration" 
                />
              </div>
            </div>
            <form className="contact-form" onSubmit={handleContactFormSubmit}>
            <div className="contact-form__header">
              <h2 className="contact-form__title">
                <span className="contact-form__title-accent">{t('writeToUs')}</span>
                <FiArrowRight className="contact-form__arrow" size={24} />
              </h2>
            </div>
            <div className="contact-form__row">
              <div className="contact-form__field">
                <label htmlFor="email-contact" className="contact-form__label">
                  Email
                </label>
                <input
                  type="email"
                  id="email-contact"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="contact-form__field">
                <label htmlFor="fullName-contact" className="contact-form__label">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  id="fullName-contact"
                  name="fullName"
                  value={contactForm.fullName}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder={t('fullNamePlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="contact-form__field">
              <label htmlFor="message-contact" className="contact-form__label">
                {t('questionDescription')}
              </label>
              <textarea
                id="message-contact"
                name="message"
                value={contactForm.message}
                onChange={handleContactFormChange}
                className="contact-form__textarea"
                  placeholder={t('questionPlaceholder')}
                rows="5"
                required
              />
            </div>
            <button type="submit" className="contact-form__submit">
              <span>{t('send')}</span>
              <FiArrowRight size={18} />
            </button>
          </form>
          </div>
        </div>
      </section>

      <div className="app__content">
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader">
            <div className="loader__circle loader__circle--1"></div>
            <div className="loader__circle loader__circle--2"></div>
          </div>
        </div>
      )}
      <nav className="categories">
        {getPropertyTypes.map((type) => {
          const IconComponent = type.icon
          const isActive = activeCategory === type.label
          return (
            <button
              type="button"
              className={`categories__item ${isActive ? 'categories__item--active' : ''}`}
              key={`${type.label}-${i18n.language}`}
              onClick={() => handleCategoryClick(type.label)}
            >
              <span className="categories__icon">
                {type.image ? (
                  <img 
                    src={type.image} 
                    alt={type.displayLabel}
                    className="categories__icon-image"
                  />
                ) : (
                  <IconComponent size={28} />
                )}
              </span>
              <span className="categories__label">{type.displayLabel}</span>
            </button>
          )
        })}
      </nav>

      <section className="section section--recommended">
        <div className="section__header">
          <h2 className="section__title">{t('recommended')} Property</h2>
        </div>

        <div className="properties-grid">
          {(filteredProperties?.recommended || recommendedProperties).map((property) => {
            const formatPrice = (price) => {
              if (price >= 1000000) {
                return `${(price / 1000000).toFixed(1)} млн Р`
              }
              return `${price.toLocaleString('ru-RU')} Р`
            }
            
            return (
              <div key={property.id} className="property-card">
                <div 
                  className="property-link"
                  onClick={() => handlePropertyClick('recommended', property.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="property-image-container">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="property-image"
                    />
                    {property.endTime && (
                      <div className="property-timer-overlay">
                        <PropertyTimer endTime={property.endTime} compact={true} />
                      </div>
                    )}
                    <button
                      type="button"
                      className={`property-favorite ${
                        favoriteProperties.get(`recommended-${property.id}`) ? 'active' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite('recommended', property.id)
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill={favoriteProperties.get(`recommended-${property.id}`) ? "currentColor" : "none"}
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="property-content">
                    <h3 className="property-title">{property.name}</h3>
                    <p className="property-location">{property.location}</p>
                    <div className="property-price">{formatPrice(propertyMode === 'rent' ? property.price : property.price * 240)}</div>
                    {property.currentBid && (
                      <div className="property-bid-info">
                        <span className="bid-label">Текущая ставка:</span>
                        <span className="bid-value">{formatPrice(property.currentBid)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section section--spaced">
        <div className="section__header">
          <h2 className="section__title">{t('nearby')} Property</h2>
        </div>

        <div className="properties-grid">
          {(filteredProperties?.nearby || nearbyProperties).map((property) => {
            const formatPrice = (price) => {
              if (price >= 1000000) {
                return `${(price / 1000000).toFixed(1)} млн Р`
              }
              return `${price.toLocaleString('ru-RU')} Р`
            }
            
            return (
              <div key={property.id} className="property-card">
                <div 
                  className="property-link"
                  onClick={() => handlePropertyClick('nearby', property.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="property-image-container">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="property-image"
                    />
                    {property.endTime && (
                      <div className="property-timer-overlay">
                        <PropertyTimer endTime={property.endTime} compact={true} />
                      </div>
                    )}
                    <button
                      type="button"
                      className={`property-favorite ${
                        favoriteProperties.get(`nearby-${property.id}`) ? 'active' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite('nearby', property.id)
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill={favoriteProperties.get(`nearby-${property.id}`) ? "currentColor" : "none"}
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="property-content">
                    <h3 className="property-title">{property.name}</h3>
                    <p className="property-location">{property.location}</p>
                    <div className="property-price">{formatPrice(propertyMode === 'rent' ? property.price : property.price * 240)}</div>
                    {property.currentBid && (
                      <div className="property-bid-info">
                        <span className="bid-label">Текущая ставка:</span>
                        <span className="bid-value">{formatPrice(property.currentBid)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
      </div>

      <nav className="bottom-nav">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon
          const isCenter = index === 2
          const getRoute = (id) => {
            if (id === 'home') return '/'
            if (id === 'favourite') return '/history'
            if (id === 'auction') return '/'
            if (id === 'chat') return '/chat'
            if (id === 'profile') return '/profile'
            return '/'
          }
          const route = getRoute(item.id)
          const isActive = location.pathname === route

          if (isCenter) {
            return (
              <button
                type="button"
                className={`bottom-nav__center ${isActive ? 'bottom-nav__center--active' : ''}`}
                key={`${item.id}-${i18n.language}`}
                onClick={() => navigate(route)}
                aria-label={item.label}
              >
                <IconComponent size={28} />
              </button>
            )
          }

          return (
            <button
              type="button"
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              key={`${item.id}-${i18n.language}`}
              onClick={() => navigate(route)}
              aria-label={item.label}
            >
              <IconComponent size={26} />
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        className="ai-button"
        onClick={toggleChat}
        aria-label="AI Assistant"
        aria-expanded={isChatOpen}
      >
        AI
      </button>

      {isChatOpen && (
        <div className="chat-widget">
          <div className="chat-widget__header">
            <div className="chat-widget__header-info">
              <div className="chat-widget__avatar">AI</div>
              <div className="chat-widget__header-text">
                <h3 className="chat-widget__title">AI Консультант</h3>
                <span className="chat-widget__status">Онлайн</span>
              </div>
            </div>
            <button
              type="button"
              className="chat-widget__close"
              onClick={toggleChat}
              aria-label="Закрыть чат"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="chat-widget__messages" ref={chatMessagesRef}>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`chat-widget__message ${
                  message.sender === 'user'
                    ? 'chat-widget__message--user'
                    : 'chat-widget__message--bot'
                }`}
              >
                <div className="chat-widget__message-content">
                  {message.text}
                </div>
                <div className="chat-widget__message-time">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>

          <form className="chat-widget__input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              className="chat-widget__input"
              placeholder="Введите ваше сообщение..."
              value={chatInput}
              onChange={handleChatInputChange}
              autoFocus
            />
            <button
              type="submit"
              className="chat-widget__send"
              aria-label={t('sendMessage')}
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      )}

      <footer className="footer">
        <div className="footer__container">
          {/* Верхний блок ссылок, как на ЦИАН — по колонкам */}
          <div className="footer__menu">
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link" onClick={() => navigate('/map')}>{t('mapLink')}</button>
              <button type="button" className="footer__menu-link" onClick={() => navigate('/subscriptions')}>{t('tariffs')}</button>
              <button type="button" className="footer__menu-link" onClick={() => navigate('/')}>{t('auction')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link" onClick={() => navigate('/data')}>{t('legalDocs')}</button>
              <button type="button" className="footer__menu-link">{t('advertising')}</button>
              <button type="button" className="footer__menu-link">{t('career')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('mapSearch')}</button>
              <button type="button" className="footer__menu-link">{t('promotion')}</button>
              <button type="button" className="footer__menu-link">{t('investors')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link" onClick={() => navigate('/')}>{t('auction')}</button>
              <button type="button" className="footer__menu-link">{t('vacancies')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('tvAdvertising')}</button>
              <button type="button" className="footer__menu-link" onClick={() => navigate('/chat')}>{t('help')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('superAgents')}</button>
              <button type="button" className="footer__menu-link">{t('mortgage')}</button>
            </div>
          </div>

          {/* Текстовый блок описания сервиса */}
          <div className="footer__description">
            <p className="footer__description-text">
              {t('footerDescription')}{' '}
              <button type="button" className="footer__description-link">{t('userAgreementLink')}</button>{' '}
              {t('and')}{' '}
              <button type="button" className="footer__description-link">{t('privacyPolicyLink')}</button>{' '}
              Sellyourbrick. {t('payingForServices')}{' '}
              <button type="button" className="footer__description-link">{t('licenseAgreement')}</button>.
            </p>
            <p className="footer__description-text">
              {t('recommendationTechDescription')}{' '}
              <button type="button" className="footer__description-link">{t('recommendationTech')}</button>.
            </p>
          </div>

          {/* Нижняя полоса с логотипом и кнопками, как на скрине */}
          <div className="footer__bottom">
            <div className="footer__brand">
              <div className="footer__brand-icon">
                <span className="footer__brand-house" />
              </div>
              <span className="footer__brand-text">Sellyourbrick</span>
            </div>

            <div className="footer__bottom-links">
              <button type="button" className="footer__bottom-link">Мобильная версия сайта</button>
              <button type="button" className="footer__bottom-link">О приложении</button>
            </div>

            <div className="footer__store-buttons">
              <button
                type="button"
                className="footer__store-btn"
                onClick={() => handleDownloadApp('android')}
                aria-label="Скачать из Google Play"
              >
                <div className="footer__store-icon footer__store-icon--google">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4285F4"/>
                    <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#EA4335"/>
                    <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#FBBC04"/>
                    <path d="M16.81 8.88L20.16 6.51C20.66 6.26 21 5.75 21 5.16V18.84C21 18.25 20.66 17.74 20.16 17.49L16.81 15.12L14.54 12.85L16.81 8.88Z" fill="#34A853"/>
                  </svg>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">Скачать из</span>
                  <span className="footer__store-name">Google Play</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                onClick={() => handleDownloadApp('ios')}
                aria-label={`${t('downloadIn')} App Store`}
              >
                <div className="footer__store-icon">
                  <FaApple size={18} />
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">App Store</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadIn')} RuStore`}
              >
                <div className="footer__store-icon footer__store-icon--rustore">
                  <span className="footer__store-icon-text">Ru</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">RuStore</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadIn')} AppGallery`}
              >
                <div className="footer__store-icon footer__store-icon--appgallery">
                  <span className="footer__store-icon-text">AG</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">AppGallery</span>
                </div>
              </button>
            </div>

            <div className="footer__language-selector" ref={languageDropdownRef}>
              <button
                type="button"
                className="footer__language-selector-btn"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                aria-label="Выбрать язык"
              >
                <span className={`footer__language-flag ${currentLanguage.flagClass}`}></span>
                <span className="footer__language-name">{currentLanguage.name}</span>
                <FiChevronDown 
                  size={16} 
                  className={`footer__language-chevron ${isLanguageDropdownOpen ? 'footer__language-chevron--open' : ''}`}
                />
              </button>
              {isLanguageDropdownOpen && (
                <div className="footer__language-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`footer__language-option ${i18n.language === lang.code ? 'footer__language-option--active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <span className={`footer__language-flag ${lang.flagClass}`}></span>
                      <span className="footer__language-name">{lang.name}</span>
                      {i18n.language === lang.code && <FiCheck size={16} className="footer__language-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainPage
