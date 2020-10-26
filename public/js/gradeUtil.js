
(() => {

    const _calculateCumulativeGpa = (grades) => {
        if (grades && grades.length) {
            const average = grades.reduce((a, b) => a + b) / grades.length;
            return parseFloat(average.toPrecision(3),2);
        }
        return 0.00;
    }

    const _calculateGpa = (targetValue, actualValue, reverse = false) => {
        if (reverse) {
            if (actualValue <= targetValue) {
                return 4.00;
            } else if (actualValue === 0) {
                return 4.00;
            } else {
                return _getWeightedGpa(((targetValue ===0) ? 1 : targetValue / actualValue) * 100);
            }
        } else {
            if (actualValue >= targetValue) {
                return 4.00;
            } else if (targetValue === 0) {
                return 0.00;
            } else {
                return _getWeightedGpa((actualValue / targetValue) * 100);
            }
        }
    }

    const _getGpa = (grade) => {
        switch (true) {
            case grade === 'A':
                return 4.00;
            case grade === 'A-' :
                return 3.67;
            case grade === 'B+':
                return 3.33;
            case grade === 'B':
                return 3;
            case grade === 'B-':
                return 2.67;
            case grade === 'C+':
                return 2.33;
            case grade === 'C':
                return 2;
            case grade === 'C-':
                return 1.67;
            case grade === 'D+':
                return 1.33;
            case grade === 'D':
                return 1;
            case grade === 'D-':
                return 0.67;
            case grade === 'F':
            default:
                return 0;
        }
    }

    const _getGrade = (gpa) => {
        switch (true) {
            case gpa >= 4:
                return 'A';
            case gpa >= 3.67:
                return 'A-';
            case gpa >= 3.33:
                return 'B+';
            case gpa >= 3:
                return 'B';
            case gpa >= 2.67:
                return 'B-';
            case gpa >= 2.33:
                return 'C+';
            case gpa >= 2:
                return 'C';
            case gpa >= 1.67:
                return 'C-';
            case gpa >= 1.33:
                return 'D+';
            case gpa >= 1:
                return 'D';
            case gpa >= 0.67:
                return 'D-';
            case gpa >= 0:
            default:
                return 'F';
        }
    }

    const _getWeightedGpa = (percent) => {
        // We're using a bell curve concept where 50% equals a C
        switch (true) {
            case percent >= 95:
                return 4;
            case percent >= 85:
                return 3.67;
            case percent >= 80:
                return 3.33;
            case percent >= 75:
                return 3;
            case percent >= 70:
                return 2.67;
            case percent >= 60:
                return 2.33;
            case percent >= 50:
                return 2;
            case percent >= 40:
                return 1.67;
            case percent >= 30:
                return 1.33;
            case percent >= 20:
                return 1;
            case percent >= 10:
                return 0.67;
            case percent >= 0:
            default:
                return 0;
        }
    }

    class GradeUtil {
        calculateCumulativeGpa = _calculateCumulativeGpa;
        calculateGpa = _calculateGpa;
        getGpa = _getGpa;
        getGrade = _getGrade;
    }

    window.gradeUtil = new GradeUtil();
})();