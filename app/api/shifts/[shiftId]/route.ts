import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { shiftId: string } }
) {
  try {
    const body = await req.json();
    const { employeeId, startTime, endTime, notes } = body;

    const shift = await prisma.shift.update({
      where: { id: params.shiftId },
      data: {
        employeeId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        notes,
      },
    });
    return NextResponse.json(shift);
  } catch (error) {
    console.error('[SHIFT_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { shiftId: string } }
) {
  try {
    const shift = await prisma.shift.delete({
      where: { id: params.shiftId },
    });
    return NextResponse.json(shift);
  } catch (error) {
    console.error('[SHIFT_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}