import { revalidatePath } from 'next/cache';

export function revalidateHome() {
  try {
    revalidatePath('/');
  } catch (error) {
    console.error('Error revalidating path "/":', error);
  }
}

export function revalidateAbout() {
  try {
    revalidatePath('/about');
  } catch (error) {
    console.error('Error revalidating path "/about":', error);
  }
}

export function revalidateCourses() {
  try {
    revalidatePath('/courses');
    revalidatePath('/computer-training');
  } catch (error) {
    console.error('Error revalidating course paths:', error);
  }
}

export function revalidateCabins() {
  try {
    revalidatePath('/cabins');
  } catch (error) {
    console.error('Error revalidating path "/cabins":', error);
  }
}

export function revalidateNotices() {
  try {
    revalidatePath('/notices');
  } catch (error) {
    console.error('Error revalidating path "/notices":', error);
  }
}

export function revalidateAll() {
  try {
    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/courses');
    revalidatePath('/computer-training');
    revalidatePath('/cabins');
    revalidatePath('/notices');
  } catch (error) {
    console.error('Error revalidating all paths:', error);
  }
}
