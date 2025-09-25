'use server';
import { prisma } from '@/lib/db';

export type Counts = {
  countries: number;
  organizations: number;
  companies: number;
  companyOffices: number;
  companyOrganizations: number;
  serviceBranches: number;
  ranks: number;
  people: number;
  personPostings: number;
  units: number;
  equipment: number;
  equipmentAssignments: number;
  meetings: number;
  meetingTopics: number;
  meetingParticipants: number;
  documents: number;
  documentLinks: number;
};

export async function getDashboardCounts(): Promise<Counts> {
  const [
    countries,
    organizations,
    companies,
    companyOffices,
    companyOrganizations,
    serviceBranches,
    ranks,
    people,
    personPostings,
    units,
    equipment,
    equipmentAssignments,
    meetings,
    meetingTopics,
    meetingParticipants,
    documents,
    documentLinks,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.organization.count(),
    prisma.company.count(),
    prisma.companyOffice.count(),
    prisma.companyOrganization.count(),
    prisma.serviceBranch.count(),
    prisma.rank.count(),
    prisma.person.count(),
    prisma.personPosting.count(),
    prisma.unit.count(),
    prisma.equipment.count(),
    prisma.equipmentAssignment.count(),
    prisma.meeting.count(),
    prisma.meetingTopic.count(),
    prisma.meetingParticipant.count(),
    prisma.document.count(),
    prisma.documentLink.count(),
  ]);

  return {
    countries,
    organizations,
    companies,
    companyOffices,
    companyOrganizations,
    serviceBranches,
    ranks,
    people,
    personPostings,
    units,
    equipment,
    equipmentAssignments,
    meetings,
    meetingTopics,
    meetingParticipants,
    documents,
    documentLinks,
  };
}
