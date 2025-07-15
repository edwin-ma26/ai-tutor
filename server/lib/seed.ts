import { prisma } from './prisma';
import { DIFFERENTIAL_EQUATIONS_UNITS } from '../../shared/schema';

export async function seedDefaultCourse(userId: string) {
  // Check if user already has a differential equations course
  const existingCourse = await prisma.course.findFirst({
    where: {
      userId,
      title: "Differential Equations"
    }
  });

  if (existingCourse) {
    return existingCourse;
  }

  // Create the default differential equations course
  const course = await prisma.course.create({
    data: {
      title: "Differential Equations",
      userId,
    }
  });

  // Create the units for this course
  for (let i = 0; i < DIFFERENTIAL_EQUATIONS_UNITS.length; i++) {
    const unit = DIFFERENTIAL_EQUATIONS_UNITS[i];
    await prisma.unit.create({
      data: {
        title: unit.title,
        courseId: course.id,
      }
    });
  }

  return course;
}

export async function getUserCourseData(userId: string) {
  const course = await prisma.course.findFirst({
    where: { userId },
    include: {
      units: {
        include: {
          subtopics: {
            include: {
              infoPages: true,
              questionPages: true
            }
          }
        }
      }
    }
  });

  return course;
}

export async function createSubtopicsForUnit(unitId: string, subtopics: Array<{title: string, description: string}>) {
  const createdSubtopics = [];
  
  for (let i = 0; i < subtopics.length; i++) {
    const subtopic = await prisma.subtopic.create({
      data: {
        title: subtopics[i].title,
        description: subtopics[i].description,
        unitId,
        orderIndex: i,
      }
    });
    createdSubtopics.push(subtopic);
  }
  
  return createdSubtopics;
}

export async function createInfoPage(subtopicId: string, title: string, content: any) {
  return await prisma.infoPage.create({
    data: {
      subtopicId,
      title,
      content: JSON.stringify(content),
      orderIndex: 0, // For now, one info page per subtopic
    }
  });
}

export async function createQuestionPage(subtopicId: string, questions: any) {
  return await prisma.questionPage.create({
    data: {
      subtopicId,
      questions: JSON.stringify(questions),
      orderIndex: 0, // For now, one question page per subtopic
    }
  });
}