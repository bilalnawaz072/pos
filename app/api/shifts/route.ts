import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error('[SHIFTS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, startTime, endTime, notes } = body;

    if (!employeeId || !startTime || !endTime) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        employeeId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error('[SHIFTS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}