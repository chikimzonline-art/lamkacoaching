'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  User,
  BookOpen,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  id: string;
  name: string;
  courses: {
    id: string;
    name: string;
    duration: string | null;
    totalFee: number;
    description: string | null;
  }[];
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

/* ─────────────────────────────────────────────
   Step Progress Stepper Component
   ───────────────────────────────────────────── */
function StepStepper({ currentStep, steps }: { currentStep: number; steps: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal stepper */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all duration-300
                    ${isCompleted
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : isActive
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md shadow-cyan-200/50 dark:shadow-cyan-900/30'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    isActive
                      ? 'text-cyan-700 dark:text-cyan-400'
                      : isCompleted
                        ? 'text-cyan-600 dark:text-cyan-500'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 w-16 lg:w-24 mx-2 transition-all duration-500
                    ${index < currentStep
                      ? 'bg-cyan-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="flex sm:hidden">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle + line */}
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div
                      className={`
                        h-0.5 flex-1 transition-all duration-500
                        ${index <= currentStep
                          ? 'bg-cyan-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}
                    />
                  )}
                  <div
                    className={`
                      flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 transition-all duration-300
                      ${isCompleted
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : isActive
                          ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 text-cyan-600 dark:text-cyan-400'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        h-0.5 flex-1 transition-all duration-500
                        ${index < currentStep
                          ? 'bg-cyan-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                        }
                      `}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] sm:text-xs font-medium transition-colors duration-300 text-center ${
                    isActive
                      ? 'text-cyan-700 dark:text-cyan-400'
                      : isCompleted
                        ? 'text-cyan-600 dark:text-cyan-500'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide animation variants
   ───────────────────────────────────────────── */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId') || '';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [startDate, setStartDate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const steps = [
    { label: 'Personal Info', icon: <User className="h-5 w-5" /> },
    { label: 'Course Selection', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Review & Submit', icon: <ClipboardCheck className="h-5 w-5" /> },
  ];

  useEffect(() => {
    fetch('/api/public/courses')
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data.departments || []);
        if (preselectedCourseId) {
          setCourseId(preselectedCourseId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preselectedCourseId]);

  const allCourses = departments.flatMap((d) =>
    d.courses.map((c) => ({ ...c, departmentName: d.name }))
  );

  const selectedCourse = allCourses.find((c) => c.id === courseId);

  // Validation helpers
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!name.trim()) {
          toast.error('Please enter your name');
          return false;
        }
        if (!phone.trim()) {
          toast.error('Please enter your phone number');
          return false;
        }
        if (!/^[6-9]\d{9}$/.test(phone.trim())) {
          toast.error('Please enter a valid 10-digit Indian phone number');
          return false;
        }
        return true;
      case 1:
        // Course is optional, so step 1 is always valid
        return true;
      case 2:
        if (!agreedToTerms) {
          toast.error('Please agree to the terms to continue');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goToStep = (step: number) => {
    if (step > currentStep) {
      // Going forward: validate current step first
      if (!validateStep(currentStep)) return;
    }
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          courseId: courseId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setRegisteredName(name.trim());
      setSuccess(true);
      toast.success('Registration successful!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <section className="py-16 sm:py-24 bg-white dark:bg-gray-950">
          <div className="max-w-lg mx-auto px-4 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            >
              Registration Successful!
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed"
            >
              Welcome, <span className="font-semibold text-gray-900 dark:text-gray-100">{registeredName}</span>! Your registration has been submitted successfully.
              We will contact you shortly with further details.
            </motion.p>
            {selectedCourse && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="mt-6 border-0 shadow-sm bg-cyan-50/50 dark:bg-cyan-950/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enrolled in: <span className="font-semibold text-cyan-700 dark:text-cyan-400">{selectedCourse.name}</span>
                    </p>
                    {selectedCourse.totalFee > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Course fee: {formatCurrency(selectedCourse.totalFee)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Our team will confirm your enrollment and share payment details.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/courses">
                <Button variant="outline" className="gap-2 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30">
                  Browse More Courses
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-cyan-600 to-sky-500 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Student Registration</h1>
          <p className="mt-2 text-cyan-100 text-lg max-w-xl mx-auto">
            Register yourself to enroll in courses and book study cabins
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white dark:bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Stepper */}
          <div className="mb-8">
            <StepStepper currentStep={currentStep} steps={steps} />
          </div>

          <Card className="border-0 dark:border dark:border-gray-700 dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <CardHeader className="pb-2 px-6 pt-6">
              <div className="flex items-center gap-2">
                {steps[currentStep].icon}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{steps[currentStep].label}</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep === 0 && 'Enter your personal details to get started'}
                {currentStep === 1 && 'Choose a course and set your preferred start date'}
                {currentStep === 2 && 'Review your information before submitting'}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <AnimatePresence mode="wait" custom={direction}>
                {/* ───────────── Step 1: Personal Info ───────────── */}
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-5"
                  >
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={submitting}
                          className="h-11 pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          disabled={submitting}
                          className="h-11 pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">We will use this to contact you</p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com (optional)"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitting}
                          className="h-11 pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="address"
                          placeholder="Your address (optional)"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={submitting}
                          className="pl-9 min-h-[80px] resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ───────────── Step 2: Course Selection ───────────── */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-5"
                  >
                    {/* Department & Course Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Select a Course
                      </Label>
                      {loading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading courses...
                        </div>
                      ) : allCourses.length > 0 ? (
                        <Select value={courseId} onValueChange={setCourseId}>
                          <SelectTrigger className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue placeholder="Choose a course (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => [
                              <div key={`label-${dept.id}`} className="px-2 py-1.5 text-xs font-semibold text-cyan-600 uppercase tracking-wider">
                                {dept.name}
                              </div>,
                              ...dept.courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{course.name}</span>
                                    <span className="text-xs text-gray-400">
                                      {formatCurrency(course.totalFee)}
                                    </span>
                                  </div>
                                </SelectItem>
                              )),
                            ])}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No courses available at the moment</p>
                      )}
                    </div>

                    {/* Selected Course Details Card */}
                    {selectedCourse && (
                      <Card className="bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                              <GraduationCap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-cyan-800 dark:text-cyan-300">{selectedCourse.name}</p>
                              <p className="text-xs text-cyan-600 dark:text-cyan-400">{selectedCourse.departmentName}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Fee:</span>{' '}
                              <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(selectedCourse.totalFee)}</span>
                            </div>
                            {selectedCourse.duration && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Duration:</span>{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{selectedCourse.duration}</span>
                              </div>
                            )}
                          </div>
                          {selectedCourse.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{selectedCourse.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium">
                        Preferred Start Date
                      </Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          disabled={submitting}
                          className="h-11 pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">When would you like to start? (optional)</p>
                    </div>

                    {!courseId && (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-4">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          No course selected — you can still register and choose a course later. Our team will help you pick the right program!
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ───────────── Step 3: Review & Submit ───────────── */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-5"
                  >
                    {/* Personal Info Summary */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          Personal Information
                        </h3>
                        <button
                          type="button"
                          onClick={() => goToStep(0)}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Name:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{phone}</span>
                        </div>
                        {email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
                          </div>
                        )}
                        {address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Course Selection Summary */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          Course Details
                        </h3>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      {selectedCourse ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Course:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCourse.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Department:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCourse.departmentName}</span>
                          </div>
                          {selectedCourse.duration && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCourse.duration}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Fee:</span>
                            <span className="font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(selectedCourse.totalFee)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No course selected — you can choose later</p>
                      )}
                      {startDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Start date:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(startDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 rounded-xl bg-cyan-50/30 dark:bg-cyan-950/10 border border-cyan-100 dark:border-cyan-900/30 p-4">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        className="mt-0.5 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer">
                        I agree to be contacted by Lamka Coaching Center regarding courses, admissions, and related updates. I understand that my information will be used solely for enrollment purposes.
                      </Label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={submitting}
                    className="gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Register Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
