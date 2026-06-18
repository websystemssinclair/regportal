import { describe, it, expect } from 'vitest'
import * as sectionsService from '@/services/sectionsService.js'
import * as cartService from '@/services/cartService.js'
import * as programsService from '@/services/programsService.js'
import * as registrationService from '@/services/registrationService.js'
import * as adminService from '@/services/adminService.js'
import * as authService from '@/services/authService.js'
import * as booklistService from '@/services/booklistService.js'

const services = [
  ['sectionsService', sectionsService],
  ['cartService', cartService],
  ['programsService', programsService],
  ['registrationService', registrationService],
  ['adminService', adminService],
  ['authService', authService],
  ['booklistService', booklistService],
]

describe('service modules export named functions', () => {
  for (const [name, mod] of services) {
    it(`${name} has at least one exported function`, () => {
      const exports = Object.values(mod)
      expect(exports.length, `${name} has no exports`).toBeGreaterThan(0)
      expect(exports.every((e) => typeof e === 'function'), `${name} has non-function export`).toBe(true)
    })
  }
})
